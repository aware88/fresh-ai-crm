/**
 * Email Queue Service
 * 
 * This module provides functionality for managing the email processing queue.
 * It handles adding emails to the queue, processing them, and updating their status.
 */

import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
  
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
  const supabase = createClient();
  
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
  const supabase = createClient();
  
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
    
    // Step 1: Analyze the email with AI
    const analysis = await analyzeEmailWithAI(email.raw_content, email.subject);
    
    // Step 2: Extract metadata (language, intent, etc.)
    const metadata = {
      language_detection: extractLanguageFromAnalysis(analysis),
      intent_classification: extractIntentFromAnalysis(analysis),
      analyzed_at: new Date().toISOString()
    };
    
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
    
    // Step 5: Determine if manual review is required
    const requiresManualReview = context.processingInstructions.requireManualReview;
    
    // Step 6: Update queue item status
    const newStatus = requiresManualReview ? 
      EmailQueueStatus.REQUIRES_REVIEW : 
      EmailQueueStatus.COMPLETED;
    
    const { error: queueUpdateError } = await supabase
      .from('email_queue')
      .update({
        status: newStatus,
        metadata: {
          ...queueItem.metadata,
          analysis_summary: summarizeAnalysis(analysis),
          processing_context: context,
          requires_manual_review: requiresManualReview
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
  const supabase = createClient();
  
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
  const supabase = createClient();
  
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

/**
 * Extract language detection from AI analysis
 * @param analysis AI analysis text
 * @returns Language detection object
 */
function extractLanguageFromAnalysis(analysis: string) {
  // Simple extraction logic - in production, this would use more sophisticated NLP
  const languageMatch = analysis.match(/language:\s*([a-zA-Z]+)/i);
  const language = languageMatch ? languageMatch[1].toLowerCase() : 'en';
  
  return {
    language,
    confidence: 0.9, // Placeholder - would be determined by actual NLP
    detected_at: new Date().toISOString()
  };
}

/**
 * Extract intent classification from AI analysis
 * @param analysis AI analysis text
 * @returns Intent classification object
 */
function extractIntentFromAnalysis(analysis: string) {
  // Simple extraction logic - in production, this would use more sophisticated NLP
  let primaryIntent = 'general_inquiry'; // Default intent
  
  // Check for common intents
  if (analysis.toLowerCase().includes('product') || 
      analysis.toLowerCase().includes('purchase') ||
      analysis.toLowerCase().includes('buy')) {
    primaryIntent = 'product_inquiry';
  } else if (analysis.toLowerCase().includes('support') || 
             analysis.toLowerCase().includes('help') ||
             analysis.toLowerCase().includes('issue')) {
    primaryIntent = 'support_request';
  } else if (analysis.toLowerCase().includes('complaint') || 
             analysis.toLowerCase().includes('dissatisfied') ||
             analysis.toLowerCase().includes('unhappy')) {
    primaryIntent = 'complaint';
  }
  
  return {
    primary_intent: primaryIntent,
    confidence: 0.8, // Placeholder - would be determined by actual NLP
    secondary_intents: [],
    classified_at: new Date().toISOString()
  };
}

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
