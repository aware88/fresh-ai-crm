/**
 * Email Queue Service
 * 
 * This module provides functionality for managing the email processing queue.
 * It handles adding emails to the queue, processing them, and updating their status.
 */

// Import client dynamically to avoid circular dependencies and handle build-time safely
async function createClient() {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    return createClient();
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Return a comprehensive mock client that simulates all used method chains
    // Mock response factory to ensure consistent return shape
    const mockResponse = (data = null) => ({ data, error: null });
    
    // Create a chainable mock that handles any method call
    const createChainableMock = () => {
      const handler = {
        get: (target: any, prop: string) => {
          // Return empty arrays/objects for common properties
          if (prop === 'data') return [];
          if (prop === 'error') return null;
          if (prop === 'rpc') return () => ({ data: null, error: null });
          
          // Return a function for any method call that returns another chainable mock
          return (...args: any[]) => {
            // For terminal operations that should return data
            if (['single', 'maybeSingle'].includes(prop)) {
              return mockResponse(null);
            }
            // Continue the chain for all other methods
            return new Proxy({}, handler);
          };
        }
      };
      return new Proxy({}, handler);
    };
    
    // Create the base mock client
    return {
      from: () => createChainableMock(),
      rpc: () => mockResponse(null)
    };
  }
}
import { analyzeEmailWithAI } from './emailAnalyzer';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { buildEmailProcessingContext } from '@/lib/ai/email-context-builder';

// Define queue item status types
export enum EmailQueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REQUIRES_REVIEW = 'requires_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Define priority levels
export enum EmailQueuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Add an email to the processing queue
 * @param emailId ID of the email to queue
 * @param contactId ID of the contact associated with the email
 * @param priority Priority level for processing
 * @param userId ID of the user adding the email to the queue
 * @param organizationId Optional organization ID for multi-tenant support
 * @returns The created queue item
 */
export async function addEmailToQueue(
  emailId: string,
  contactId: string,
  priority: EmailQueuePriority = EmailQueuePriority.MEDIUM,
  userId: string,
  organizationId?: string
) {
  const supabase = await createClient();
  
  // Add the email to the queue
  const { data: queueItem, error } = await supabase
    .from('email_queue')
    .insert({
      email_id: emailId,
      contact_id: contactId,
      status: EmailQueueStatus.PENDING,
      priority,
      created_by: userId,
      organization_id: organizationId
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding email to queue:', error);
    throw error;
  }
  
  return queueItem;
}

/**
 * Get the next email to process from the queue
 * @param userId ID of the user processing the queue
 * @param organizationId Optional organization ID for multi-tenant support
 * @returns The next queue item to process, or null if none available
 */
export async function getNextEmailToProcess(userId: string, organizationId?: string) {
  const supabase = await createClient();
  
  // Build the query
  let query = supabase
    .from('email_queue')
    .select('*, emails(*)')
    .eq('status', EmailQueueStatus.PENDING)
    .order('priority', { ascending: false }) // Process high priority first
    .order('created_at', { ascending: true }); // Then oldest first
  
  // Add organization filter if provided
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  // Get the next item
  const { data: queueItems, error } = await query.limit(1);
  
  if (error) {
    console.error('Error getting next email to process:', error);
    throw error;
  }
  
  if (!queueItems || queueItems.length === 0) {
    return null; // No items to process
  }
  
  // Mark the item as processing
  const queueItem = queueItems[0];
  const { error: updateError } = await supabase
    .from('email_queue')
    .update({
      status: EmailQueueStatus.PROCESSING,
      processing_attempts: queueItem.processing_attempts + 1,
      last_processed_at: new Date().toISOString()
    })
    .eq('id', queueItem.id);
  
  if (updateError) {
    console.error('Error updating queue item status:', updateError);
    throw updateError;
  }
  
  return queueItem;
}

/**
 * Process an email in the queue
 * @param queueItemId ID of the queue item to process
 * @param userId ID of the user processing the email
 * @returns The processed queue item
 */
export async function processQueuedEmail(queueItemId: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // Get the queue item with email data
    const { data: queueItem, error } = await supabase
      .from('email_queue')
      .select('*, emails(*)')
      .eq('id', queueItemId)
      .single();
    
    if (error || !queueItem) {
      throw new Error(`Queue item not found: ${error?.message || 'Unknown error'}`);
    }
    
    // Extract email content for processing
    const email = queueItem.emails;
    if (!email) {
      throw new Error('Email not found in queue item');
    }
    
    // Step 1: Analyze the email with Unified AI Analysis Service
    const { UnifiedAIAnalysisService } = await import('@/lib/ai/unified-analysis-service');
    const { getOpenAIClient } = await import('@/lib/openai/client');
    const { createServerClient } = await import('@/lib/supabase/server');
    
    const supabaseClient = await createServerClient();
    const openai = getOpenAIClient();
    
    // Get organization ID for user
    let organizationId;
    try {
      const { data: userOrg } = await supabaseClient
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
      organizationId = userOrg?.organization_id;
    } catch (error) {
      console.log('[EmailQueue] No organization found for user');
    }

    const analysisService = new UnifiedAIAnalysisService(supabaseClient, openai, organizationId || '', userId);
    
    const analysisResult = await analysisService.analyzeEmail({
      emailId: email.id,
      emailContent: {
        from: email.sender || email.from_address || 'Unknown',
        to: email.recipient || email.to_address || '',
        subject: email.subject || '(No Subject)',
        body: email.raw_content || email.text_content || '',
        date: email.received_date || email.created_at
      },
      userId,
      organizationId,
      options: {
        includePersonality: true,
        includeContext: true,
        includeRecommendations: true,
        cacheResults: true
      }
    });
    
    let analysis: string;
    let metadata: any;
    
    if (analysisResult.success && analysisResult.analysis) {
      // Convert unified analysis to legacy format for compatibility
      analysis = `Language: ${analysisResult.analysis.language.name}
Category: ${analysisResult.analysis.classification.category}
Intent: ${analysisResult.analysis.classification.intent}
Urgency: ${analysisResult.analysis.classification.urgency}
Sentiment: ${analysisResult.analysis.classification.sentiment}
Keywords: ${analysisResult.analysis.classification.keywords.join(', ')}
Confidence: ${analysisResult.analysis.classification.confidence}
Response Guidance: ${analysisResult.analysis.context.responseGuidance}`;

      metadata = {
        language_detection: {
          language: analysisResult.analysis.language.code,
          confidence: analysisResult.analysis.language.confidence,
          detected_at: new Date().toISOString()
        },
        intent_classification: {
          primary_intent: analysisResult.analysis.classification.intent,
          category: analysisResult.analysis.classification.category,
          confidence: analysisResult.analysis.classification.confidence,
          classified_at: new Date().toISOString()
        },
        unified_analysis: {
          version: analysisResult.metadata.analysisVersion,
          model_used: analysisResult.metadata.modelUsed,
          tokens_used: analysisResult.metadata.tokensUsed,
          cost_usd: analysisResult.metadata.costUsd,
          processing_time_ms: analysisResult.metadata.processingTimeMs
        },
        analyzed_at: new Date().toISOString()
      };
      
      console.log(`[EmailQueue] Unified analysis completed - ${analysisResult.metadata.tokensUsed} tokens, $${analysisResult.metadata.costUsd.toFixed(4)} using ${analysisResult.metadata.modelUsed}`);
    } else {
      // Fallback analysis
      analysis = `Analysis failed: ${analysisResult.error || 'Unknown error'}`;
      metadata = {
        language_detection: { language: 'en', confidence: 0.5, detected_at: new Date().toISOString() },
        intent_classification: { primary_intent: 'general_inquiry', confidence: 0.5, classified_at: new Date().toISOString() },
        analyzed_at: new Date().toISOString(),
        error: analysisResult.error
      };
      
      console.error('[EmailQueue] Unified analysis failed, using fallback');
    }
    
    // Step 3: Update the email with analysis and metadata
    const { error: emailUpdateError } = await supabase
      .from('emails')
      .update({
        analysis,
        metadata
      })
      .eq('id', email.id);
    
    if (emailUpdateError) {
      throw new Error(`Failed to update email: ${emailUpdateError.message}`);
    }
    
    // Step 4: Build comprehensive context for AI processing
    const context = await buildEmailProcessingContext(email.id);
    
    // Step 5: Generate background draft using learned patterns (NEW LEARNING SYSTEM)
    let aiDraft: { subject: string; body: string; confidence: number } | null = null;
    try {
      // Use unified AI drafting service for background processing
      const { UnifiedAIDraftingService } = await import('@/lib/ai/unified-drafting-service');
      const { getOpenAIClient } = await import('@/lib/openai/client');
      const { createServerClient } = await import('@/lib/supabase/server');
      
      const supabase = await createServerClient();
      const openai = getOpenAIClient();
      
      // Get organization ID for user
      let organizationId;
      try {
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', userId)
          .single();
        organizationId = userOrg?.organization_id;
      } catch (error) {
        console.log('[EmailQueue] No organization found for user');
      }

      const unifiedService = new UnifiedAIDraftingService(supabase, openai, organizationId || '', userId);
      
      const draftingContext = {
        emailId: email.id,
        originalEmail: {
          from: email.sender || email.from_address || 'Unknown',
          to: email.recipient || email.to_address || '',
          subject: email.subject || '(No Subject)',
          body: email.raw_content || email.text_content || '',
          date: email.received_date || email.created_at
        },
        userId,
        organizationId,
        settings: {
          responseStyle: 'professional' as const,
          responseLength: 'detailed' as const,
          includeContext: true
        }
      };

      const result = await unifiedService.generateDraft(draftingContext);
      
      if (result.success && result.draft) {
        aiDraft = {
          subject: result.draft.subject,
          body: result.draft.body,
          confidence: result.draft.confidence
        };
        console.log(`[EmailQueue] Generated unified draft with confidence ${result.draft.confidence} (${result.metadata.modelUsed}, ${result.metadata.tokensUsed} tokens, $${result.metadata.costUsd.toFixed(4)})`);
      } else {
        console.log(`[EmailQueue] Unified draft failed: ${result.error}, using fallback`);
        throw new Error(result.error || 'Unified service failed');
      }
    } catch (e) {
      console.error('[EmailQueue] Error in unified draft generation:', e);
      
      // Fallback to simple API call
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resp = await fetch(`${appUrl}/api/emails/ai-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: email.id,
            originalEmail: {
              from: email.sender || email.from_address || 'Unknown',
              to: email.recipient || email.to_address || '',
              subject: email.subject || '(No Subject)',
              body: email.raw_content || email.text_content || ''
            },
            settings: { includeContext: true }
          })
        });
        
        if (resp.ok) {
          const data = await resp.json();
          aiDraft = {
            subject: data.subject || `Re: ${email.subject || ''}`,
            body: data.body || '',
            confidence: data.confidence || 0.85
          };
          console.log(`[EmailQueue] Generated fallback draft`);
        }
      } catch (fallbackError) {
        console.error('[EmailQueue] Fallback draft generation also failed:', fallbackError);
        // Non-fatal; proceed without draft
        aiDraft = null;
      }
    }

    // Step 6: Determine if manual review is required, factoring in user auto-reply preferences
    const requiresManualReviewBase = context.processingInstructions.requireManualReview;
    let requiresManualReview = requiresManualReviewBase;
    let autoApproved = false;
    try {
      // Fetch user-level AI email settings
      const { data: userSettings } = await supabase
        .from('user_ai_email_settings')
        .select('auto_reply_mode, auto_reply_confidence_threshold')
        .eq('user_id', userId)
        .maybeSingle();
      const mode = (userSettings?.auto_reply_mode as 'semi' | 'full') || 'semi';
      const threshold = typeof userSettings?.auto_reply_confidence_threshold === 'number' ? userSettings.auto_reply_confidence_threshold : 0.9;
      if (mode === 'full' && aiDraft && aiDraft.confidence >= threshold && !requiresManualReviewBase) {
        requiresManualReview = false;
        autoApproved = true;
      }
    } catch (_e) {
      // Ignore settings errors; default to base behavior
    }
    
    // Step 7: Update queue item status
    const newStatus = requiresManualReview ? 
      EmailQueueStatus.REQUIRES_REVIEW : 
      (autoApproved ? EmailQueueStatus.APPROVED : EmailQueueStatus.COMPLETED);
    
    const { error: queueUpdateError } = await supabase
      .from('email_queue')
      .update({
        status: newStatus,
        metadata: {
          ...queueItem.metadata,
          analysis_summary: summarizeAnalysis(analysis),
          processing_context: context,
          requires_manual_review: requiresManualReview,
          ai_draft: aiDraft || undefined,
          auto_approved: autoApproved || undefined
        },
        requires_manual_review: requiresManualReview,
        last_processed_at: new Date().toISOString()
      })
      .eq('id', queueItemId);
    
    if (queueUpdateError) {
      throw new Error(`Failed to update queue item: ${queueUpdateError.message}`);
    }
    
    // Return the updated queue item
    return {
      id: queueItemId,
      status: newStatus,
      requiresManualReview,
      analysis,
      metadata
    };
  } catch (error) {
    // Handle errors by updating the queue item
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing queued email:', errorMessage);
    
    // Update the queue item with error information
    const { error: updateError } = await supabase
      .from('email_queue')
      .update({
        status: EmailQueueStatus.FAILED,
        error_message: errorMessage,
        last_processed_at: new Date().toISOString()
      })
      .eq('id', queueItemId);
    
    if (updateError) {
      console.error('Error updating queue item with failure status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Get emails requiring manual review
 * @param userId ID of the user retrieving the emails
 * @param organizationId Optional organization ID for multi-tenant support
 * @returns Array of queue items requiring review
 */
export async function getEmailsRequiringReview(userId: string, organizationId?: string) {
  const supabase = await createClient();
  
  // Build the query
  let query = supabase
    .from('email_queue')
    .select('*, emails(*), contacts(*)')
    .eq('status', EmailQueueStatus.REQUIRES_REVIEW)
    .order('priority', { ascending: false }) // High priority first
    .order('created_at', { ascending: true }); // Then oldest first
  
  // Add organization filter if provided
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  // Get the items
  const { data: queueItems, error } = await query;
  
  if (error) {
    console.error('Error getting emails requiring review:', error);
    throw error;
  }
  
  return queueItems || [];
}

/**
 * Approve or reject an email response
 * @param queueItemId ID of the queue item to approve/reject
 * @param approved Whether the response is approved
 * @param userId ID of the user approving/rejecting
 * @param feedback Optional feedback about the response
 * @returns The updated queue item
 */
export async function reviewEmailResponse(
  queueItemId: string,
  approved: boolean,
  userId: string,
  feedback?: string
) {
  const supabase = await createClient();
  
  // Update the queue item status based on approval
  const newStatus = approved ? 
    EmailQueueStatus.APPROVED : 
    EmailQueueStatus.REJECTED;
  
  const { data: queueItem, error } = await supabase
    .from('email_queue')
    .update({
      status: newStatus,
      metadata: supabase.rpc('jsonb_set_nested', { 
        json_data: supabase.rpc('get_queue_item_metadata', { queue_item_id: queueItemId }),
        path: 'review',
        new_value: JSON.stringify({
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          approved,
          feedback
        })
      }),
      updated_at: new Date().toISOString()
    })
    .eq('id', queueItemId)
    .select()
    .single();
  
  if (error) {
    console.error('Error reviewing email response:', error);
    throw error;
  }
  
  return queueItem;
}

// Legacy analysis functions removed - now handled by UnifiedAIAnalysisService

/**
 * Create a summary of the AI analysis
 * @param analysis Full AI analysis text
 * @returns Brief summary of the analysis
 */
function summarizeAnalysis(analysis: string): string {
  // Simple summarization - in production, this would use more sophisticated NLP
  const maxLength = 150;
  if (analysis.length <= maxLength) return analysis;
  return analysis.substring(0, maxLength) + '...';
}

/**
 * Helper function to analyze email with AI
 * @param emailContent Email content to analyze
 * @param subject Email subject
 * @returns AI analysis of the email
 */
async function analyzeEmailWithAI(emailContent: string, subject?: string): Promise<string> {
  // This is a placeholder - in the real implementation, this would call the OpenAI API
  // or another AI service to analyze the email content
  
  // For now, we'll import the existing analyzeEmailPersonality function
  const { analyzeEmailPersonality } = require('./emailAnalyzer');
  
  // Combine subject and content for better analysis
  const fullContent = subject ? `Subject: ${subject}\n\n${emailContent}` : emailContent;
  
  try {
    return await analyzeEmailPersonality(fullContent);
  } catch (error) {
    console.error('Error analyzing email with AI:', error);
    throw error;
  }
}
