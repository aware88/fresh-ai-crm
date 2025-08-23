/**
 * BACKGROUND AI PROCESSOR
 * 
 * Proactively processes emails when they arrive in the system:
 * - AI Analysis (sentiment, classification, sales intelligence)
 * - Draft Generation (psychology-based responses)
 * - Caches results for instant UI response
 * 
 * Integrates with existing email ingestion points
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Database } from '@/types/supabase';
import { UnifiedAIDraftingService } from '@/lib/ai/unified-drafting-service';
import { UnifiedAIAnalysisService } from '@/lib/ai/unified-analysis-service';
import { ModelRouterService, TaskComplexity } from '@/lib/ai/model-router-service';
import { emailAIStreaming } from './email-ai-streaming';
import { autoReplyService } from './auto-reply-service';
import { emailFilterService } from './email-filter-service';
import { FollowUpService } from '@/lib/email/follow-up-service';

export interface BackgroundProcessingResult {
  success: boolean;
  emailId: string;
  analysis?: {
    sentiment: string;
    classification: any;
    salesIntelligence?: any;
    processingTime: number;
  };
  draft?: {
    subject: string;
    body: string;
    confidence: number;
    processingTime: number;
  };
  cached?: boolean;
  skipped?: boolean;
  reason?: string;
  category?: string;
  error?: string;
}

export interface EmailProcessingContext {
  emailId: string;
  userId: string;
  organizationId?: string;
  priority: 'low' | 'normal' | 'high';
  skipDraft?: boolean; // For emails that don't need responses
  forceReprocess?: boolean;
}

export class BackgroundAIProcessor {
  private supabase: SupabaseClient<Database>;
  private openai: OpenAI;
  private modelRouter: ModelRouterService;
  private processingQueue: Map<string, Promise<BackgroundProcessingResult>> = new Map();
  private memoryCache: Map<string, { data: any; expires: number }> = new Map(); // Fallback cache

  constructor(supabase: SupabaseClient<Database>, openai: OpenAI) {
    this.supabase = supabase;
    this.openai = openai;
    this.modelRouter = new ModelRouterService(supabase, openai);
  }

  /**
   * MAIN ENTRY POINT - Called when email arrives
   * Processes email in background, caches results
   */
  async processEmailInBackground(context: EmailProcessingContext): Promise<BackgroundProcessingResult> {
    const { emailId, userId, organizationId } = context;
    
    // Check if already processing this email
    if (this.processingQueue.has(emailId)) {
      console.log(`[BackgroundAI] Email ${emailId} already processing, waiting...`);
      return await this.processingQueue.get(emailId)!;
    }

    // Start processing
    const processingPromise = this.performBackgroundProcessing(context);
    this.processingQueue.set(emailId, processingPromise);

    try {
      const result = await processingPromise;
      return result;
    } finally {
      // Clean up after processing
      setTimeout(() => {
        this.processingQueue.delete(emailId);
      }, 5000); // Keep for 5 seconds to handle duplicate requests
    }
  }

  /**
   * Core background processing logic
   */
  private async performBackgroundProcessing(context: EmailProcessingContext): Promise<BackgroundProcessingResult> {
    const startTime = Date.now();
    const { emailId, userId, organizationId, priority, skipDraft = false, forceReprocess = false } = context;

    console.log(`[BackgroundAI] Starting background processing for email ${emailId}`);

    try {
      // 1. Check if results already cached (unless forcing reprocess)
      if (!forceReprocess) {
        const cached = await this.getCachedResults(emailId);
        if (cached) {
          console.log(`[BackgroundAI] Using cached results for email ${emailId}`);
          return {
            success: true,
            emailId,
            analysis: cached.analysis,
            draft: cached.draft,
            cached: true
          };
        }
      }

      // 2. Load email data
      const emailData = await this.loadEmailData(emailId);
      if (!emailData) {
        throw new Error(`Email ${emailId} not found`);
      }

      // 3. Check if email should be filtered (newsletters, auto-replies, etc.)
      const filterResult = await emailFilterService.shouldProcessEmail({
        from: emailData.from || '',
        subject: emailData.subject || '',
        body: emailData.body || '',
        headers: emailData.headers
      });

      if (!filterResult.shouldProcess) {
        console.log(`[BackgroundAI] Skipping email ${emailId}: ${filterResult.reason}`);
        return {
          success: true,
          emailId,
          skipped: true,
          reason: filterResult.reason,
          category: filterResult.category
        };
      }

      // 4. Determine task complexity for model selection
      const complexity = this.determineTaskComplexity(emailData);
      console.log(`[BackgroundAI] Task complexity: ${complexity}`);

      // 5. Run AI Analysis and Draft Generation in PARALLEL
      const parallelTasks = [];

      // Always run analysis
      parallelTasks.push(this.runAnalysisTask(emailData, userId, organizationId, complexity));

      // Run drafting only if not skipped
      if (!skipDraft) {
        parallelTasks.push(this.runDraftingTask(emailData, userId, organizationId, complexity));
      }

      // Execute tasks in parallel
      const results = await Promise.allSettled(parallelTasks);
      
      const analysisResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const draftResult = !skipDraft && results[1] && results[1].status === 'fulfilled' ? results[1].value : null;

      // 6. Cache results for instant UI access
      await this.cacheResults(emailId, analysisResult, draftResult);

      // 7. Create follow-up tracking for outbound emails automatically
      await this.createFollowUpTracking(emailData, userId, organizationId);

      const totalTime = Date.now() - startTime;
      console.log(`[BackgroundAI] Completed processing for email ${emailId} in ${totalTime}ms`);

      return {
        success: true,
        emailId,
        analysis: analysisResult ? {
          sentiment: analysisResult.sentiment,
          classification: analysisResult.classification,
          salesIntelligence: analysisResult.salesIntelligence,
          processingTime: analysisResult.processingTime
        } : undefined,
        draft: draftResult ? {
          subject: draftResult.subject,
          body: draftResult.body,
          confidence: draftResult.confidence,
          processingTime: draftResult.processingTime
        } : undefined,
        cached: false
      };

    } catch (error) {
      console.error(`[BackgroundAI] Error processing email ${emailId}:`, error);
      return {
        success: false,
        emailId,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run AI analysis task
   */
  private async runAnalysisTask(emailData: any, userId: string, organizationId?: string, complexity: TaskComplexity = TaskComplexity.STANDARD) {
    const startTime = Date.now();
    
    try {
      const analysisService = new UnifiedAIAnalysisService(this.supabase, this.openai, organizationId || '', userId);
      
      const analysisContext = {
        emailId: emailData.id,
        email: {
          from: emailData.from_address || emailData.sender,
          to: emailData.to_address || emailData.recipient,
          subject: emailData.subject || '',
          body: emailData.raw_content || emailData.text_content || emailData.body || '',
          date: emailData.date || emailData.created_at
        },
        userId,
        organizationId,
        options: {
          includeAnalysis: true,
          includeSalesIntelligence: true,
          cacheResults: true
        }
      };

      const result = await analysisService.analyzeEmail(analysisContext);
      
      return {
        sentiment: result.analysis?.sentiment || 'neutral',
        classification: result.analysis?.classification || { category: 'general', intent: 'inquiry' },
        salesIntelligence: result.analysis?.salesIntelligence,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[BackgroundAI] Analysis task failed:', error);
      throw error;
    }
  }

  /**
   * Run AI drafting task
   */
  private async runDraftingTask(emailData: any, userId: string, organizationId?: string, complexity: TaskComplexity = TaskComplexity.STANDARD) {
    const startTime = Date.now();
    
    try {
      const draftingService = new UnifiedAIDraftingService(this.supabase, this.openai, organizationId || '', userId);
      
      const draftingContext = {
        emailId: emailData.id,
        originalEmail: {
          from: emailData.from_address || emailData.sender || '',
          to: emailData.to_address || emailData.recipient || '',
          subject: emailData.subject || '',
          body: emailData.raw_content || emailData.text_content || emailData.body || '',
          date: emailData.date || emailData.created_at
        },
        userId,
        organizationId,
        settings: {
          responseStyle: 'professional' as const,
          responseLength: 'detailed' as const,
          includeContext: true
        }
      };

      const result = await draftingService.generateDraft(draftingContext);
      
      if (!result.success || !result.draft) {
        throw new Error(result.error || 'Draft generation failed');
      }

      return {
        subject: result.draft.subject,
        body: result.draft.body,
        confidence: result.draft.confidence,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[BackgroundAI] Drafting task failed:', error);
      throw error;
    }
  }

  /**
   * Determine task complexity based on email content
   */
  private determineTaskComplexity(emailData: any): TaskComplexity {
    const content = (emailData.raw_content || emailData.text_content || emailData.body || '').toLowerCase();
    const subject = (emailData.subject || '').toLowerCase();
    
    // Simple patterns for fast model selection
    const simplePatterns = [
      'where is my order',
      'order status',
      'tracking number',
      'thank you',
      'received',
      'confirmation'
    ];

    const complexPatterns = [
      'complaint',
      'refund',
      'legal',
      'escalat',
      'manager',
      'cancel',
      'disappointed',
      'unacceptable'
    ];

    const text = `${subject} ${content}`;
    
    if (complexPatterns.some(pattern => text.includes(pattern))) {
      return TaskComplexity.COMPLEX;
    }
    
    if (simplePatterns.some(pattern => text.includes(pattern))) {
      return TaskComplexity.SIMPLE;
    }
    
    // Default to standard
    return TaskComplexity.STANDARD;
  }

  /**
   * Load email data from database
   */
  private async loadEmailData(emailId: string) {
    const { data, error } = await this.supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (error) {
      console.error('[BackgroundAI] Error loading email:', error);
      return null;
    }

    return data;
  }

  /**
   * Check for cached results (with fallback to memory cache)
   */
  private async getCachedResults(emailId: string) {
    try {
      // Try database cache first
      const { data, error } = await this.supabase
        .from('email_ai_cache')
        .select('*')
        .eq('email_id', emailId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // Check if cache is still fresh (24 hours)
        const cacheAge = Date.now() - new Date(data.created_at).getTime();
        if (cacheAge <= 24 * 60 * 60 * 1000) {
          return {
            analysis: data.analysis_result,
            draft: data.draft_result
          };
        }
      }
    } catch (error) {
      console.log('[BackgroundAI] Database cache unavailable, using memory cache');
    }

    // Fallback to memory cache
    const memCached = this.memoryCache.get(emailId);
    if (memCached && Date.now() < memCached.expires) {
      return memCached.data;
    }

    return null;
  }

  /**
   * Cache results for instant UI access (with fallback to memory cache)
   */
  private async cacheResults(emailId: string, analysisResult: any, draftResult: any) {
    const cacheData = {
      analysis: analysisResult,
      draft: draftResult
    };

    // Always cache in memory as fallback
    this.memoryCache.set(emailId, {
      data: cacheData,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    try {
      // Try to cache in database
      const { error } = await this.supabase
        .from('email_ai_cache')
        .upsert({
          email_id: emailId,
          analysis_result: analysisResult,
          draft_result: draftResult,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.log('[BackgroundAI] Database cache unavailable, using memory cache only');
      } else {
        console.log(`[BackgroundAI] Cached results for email ${emailId} in database`);
      }
    } catch (error) {
      console.log('[BackgroundAI] Using memory cache only:', error);
    }

    // Clean up old memory cache entries periodically
    if (this.memoryCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (now > value.expires) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  /**
   * Get cached results instantly for UI
   */
  async getCachedResultsForUI(emailId: string) {
    return await this.getCachedResults(emailId);
  }

  /**
   * Batch process multiple emails (for email sync)
   */
  async processEmailsBatch(contexts: EmailProcessingContext[]): Promise<BackgroundProcessingResult[]> {
    console.log(`[BackgroundAI] Processing batch of ${contexts.length} emails`);
    
    // Process in parallel with concurrency limit
    const batchSize = 5; // Process 5 emails at once
    const results: BackgroundProcessingResult[] = [];
    
    for (let i = 0; i < contexts.length; i += batchSize) {
      const batch = contexts.slice(i, i + batchSize);
      const batchPromises = batch.map(context => this.processEmailInBackground(context));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            emailId: batch[index].emailId,
            cached: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Create follow-up tracking for emails automatically
   */
  private async createFollowUpTracking(
    emailData: any,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      // Get user's email address to determine if this is outbound
      const { data: userEmail } = await this.supabase
        .from('email_accounts')
        .select('email_address')
        .eq('user_id', userId)
        .single();

      if (!userEmail?.email_address) return;

      // Check if this is an outbound email (from user) or inbound (to user)
      const isOutbound = emailData.from_address?.toLowerCase() === userEmail.email_address.toLowerCase();
      
      if (!isOutbound) {
        // For inbound emails, check if it's a response to existing follow-up
        await this.handleInboundResponse(emailData, userId, organizationId);
        return;
      }

      // For outbound emails, create follow-up tracking
      const followUpService = new FollowUpService();
      
      // Skip replies (Re: subjects)
      if (emailData.subject?.toLowerCase().startsWith('re:')) {
        return;
      }

      await followUpService.trackSentEmail({
        emailId: emailData.id,
        userId: userId,
        organizationId: organizationId,
        subject: emailData.subject,
        recipients: emailData.to_address ? [emailData.to_address] : [],
        sentAt: new Date(emailData.created_at || Date.now()),
        autoFollowup: true, // Enable automatic follow-up
        followUpType: 'ai_generated'
      });

      console.log(`[BackgroundAI] Created follow-up tracking for outbound email ${emailData.id}`);
      
    } catch (error) {
      console.error(`[BackgroundAI] Error creating follow-up tracking:`, error);
      // Don't throw - this is a background task
    }
  }

  /**
   * Handle inbound email responses to existing follow-ups
   */
  private async handleInboundResponse(
    emailData: any,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      const followUpService = new FollowUpService();
      
      // Try to match this response to an existing follow-up
      await followUpService.recordResponse({
        originalSubject: emailData.subject?.replace(/^re:\s*/i, ''),
        respondentEmail: emailData.from_address,
        responseEmailId: emailData.id,
        userId: userId,
        organizationId: organizationId
      });

      console.log(`[BackgroundAI] Processed inbound response for email ${emailData.id}`);
      
    } catch (error) {
      console.error(`[BackgroundAI] Error handling inbound response:`, error);
      // Don't throw - this is a background task
    }
  }
}

// Singleton instance for the app
let backgroundProcessor: BackgroundAIProcessor | null = null;

export function getBackgroundProcessor(supabase: SupabaseClient<Database>, openai: OpenAI): BackgroundAIProcessor {
  if (!backgroundProcessor) {
    backgroundProcessor = new BackgroundAIProcessor(supabase, openai);
  }
  return backgroundProcessor;
}

export default BackgroundAIProcessor;
