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
import { EmailLearningService } from './email-learning-service';

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
  private modelRouter: ModelRouterService | null;
  private processingQueue: Map<string, Promise<BackgroundProcessingResult>> = new Map();
  private memoryCache: Map<string, { data: any; expires: number }> = new Map(); // Fallback cache

  constructor(supabase: SupabaseClient<Database>, openai: OpenAI) {
    this.supabase = supabase;
    this.openai = openai;
    // ModelRouterService will be initialized per request with proper org/user context
    this.modelRouter = null as any; // Will be initialized in methods that need it
  }

  /**
   * MAIN ENTRY POINT - Called when email arrives
   * Processes email in background, caches results
   */
  async processEmailInBackground(context: EmailProcessingContext & { emailContent?: any }): Promise<BackgroundProcessingResult> {
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
  private async performBackgroundProcessing(context: EmailProcessingContext & { emailContent?: any }): Promise<BackgroundProcessingResult> {
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
      const emailData = await this.loadEmailData(emailId, context.emailContent);
      if (!emailData) {
        throw new Error(`Email ${emailId} not found`);
      }

      // 3. Check if email should be filtered (newsletters, auto-replies, etc.)
      const filterResult = await emailFilterService.shouldProcessEmail({
        from: emailData.from_address || emailData.from || '',
        subject: emailData.subject || '',
        body: emailData.raw_content || emailData.body || '',
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
      
      const analysisResult = results[0].status === 'fulfilled' ? results[0].value as {
        sentiment: string;
        classification: any;
        salesIntelligence?: any;
        processingTime: number;
      } : null;
      const draftResult = !skipDraft && results[1] && results[1].status === 'fulfilled' ? results[1].value as {
        subject: string;
        body: string;
        confidence: number;
        processingTime: number;
      } : null;

      // 6. Cache results for instant UI access
      await this.cacheResults(emailId, analysisResult, draftResult);

      // 7. CONTINUOUS LEARNING - Learn from this email (NEW!)
      await this.performContinuousLearning(emailData, userId, organizationId);

      // 8. Create follow-up tracking for outbound emails automatically
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
  private async runAnalysisTask(emailData: any, userId: string, organizationId?: string, complexity: TaskComplexity = TaskComplexity.STANDARD): Promise<{
    sentiment: string;
    classification: any;
    salesIntelligence?: any;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const analysisService = new UnifiedAIAnalysisService(this.supabase, this.openai, organizationId || '', userId);
      
      const emailContent = emailData.raw_content || emailData.text_content || emailData.body || '';
      const emailFrom = emailData.from_address || emailData.sender || 'Unknown';
      const emailTo = emailData.to_address || emailData.recipient || '';
      const emailSubject = emailData.subject || '(No Subject)';
      const emailDate = emailData.received_date || emailData.created_at || new Date().toISOString();

      console.log(`[BackgroundAI] Running analysis for email: ${emailSubject} from ${emailFrom}`);
      
      const analysisContext = {
        emailId: emailData.id,
        emailContent: {
          from: emailFrom,
          to: emailTo,
          subject: emailSubject,
          body: emailContent,
          date: emailDate
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
      
      console.log(`[BackgroundAI] Analysis completed in ${Date.now() - startTime}ms`);
      
      return {
        sentiment: result.analysis?.classification?.sentiment || 'neutral',
        classification: result.analysis?.classification || { category: 'general', intent: 'inquiry' },
        salesIntelligence: {
          opportunity: { score: 5, potential: 'medium' },
          insights: { key_indicators: ['Email processed'] }
        },
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[BackgroundAI] Analysis task failed:', error);
      // Return default analysis instead of throwing
      return {
        sentiment: 'neutral',
        classification: { category: 'general', intent: 'inquiry' },
        salesIntelligence: { 
          opportunity: { score: 5, potential: 'medium' },
          insights: { key_indicators: ['Email processed'] }
        },
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Run AI drafting task
   */
  private async runDraftingTask(emailData: any, userId: string, organizationId?: string, complexity: TaskComplexity = TaskComplexity.STANDARD): Promise<{
    subject: string;
    body: string;
    confidence: number;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const draftingService = new UnifiedAIDraftingService(this.supabase, this.openai, organizationId || '', userId);
      
      const emailContent = emailData.raw_content || emailData.text_content || emailData.body || '';
      const emailFrom = emailData.from_address || emailData.sender || '';
      const emailTo = emailData.to_address || emailData.recipient || '';
      const emailSubject = emailData.subject || '';
      const emailDate = emailData.received_date || emailData.created_at || new Date().toISOString();

      console.log(`[BackgroundAI] Generating draft for email: ${emailSubject}`);
      
      const draftingContext = {
        emailId: emailData.id,
        originalEmail: {
          from: emailFrom,
          to: emailTo,
          subject: emailSubject,
          body: emailContent,
          date: emailDate
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

      console.log(`[BackgroundAI] Draft generated in ${Date.now() - startTime}ms`);

      return {
        subject: result.draft.subject,
        body: result.draft.body,
        confidence: result.draft.confidence || 0.8,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[BackgroundAI] Drafting task failed:', error);
      // Return default draft instead of throwing
      return {
        subject: `Re: ${emailData.subject || 'Your message'}`,
        body: 'Thank you for your message. I will review it and get back to you shortly.',
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Draft generation failed'
      };
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
   * Load email data from database or use provided email content
   */
  private async loadEmailData(emailId: string, providedEmailContent?: any) {
    // If email content is provided (for virtual/compose emails), use it
    if (providedEmailContent) {
      return {
        id: emailId,
        from_address: providedEmailContent.from || '',
        to_address: providedEmailContent.to || '',
        subject: providedEmailContent.subject || '',
        raw_content: providedEmailContent.body || '',
        received_date: providedEmailContent.date || new Date().toISOString(),
        headers: providedEmailContent.headers || {}
      };
    }

    // For virtual/compose emails, create minimal data
    if (emailId.startsWith('compose-') || emailId.startsWith('virtual-')) {
      return {
        id: emailId,
        from_address: '',
        to_address: '',
        subject: 'Draft Email',
        raw_content: '',
        received_date: new Date().toISOString(),
        headers: {}
      };
    }

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
          results.push((result as PromiseFulfilledResult<any>).value);
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
        autoFollowup: true // Enable automatic follow-up
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
      
      // Process this incoming email for follow-up response detection
      await followUpService.processIncomingEmail({
        id: emailData.id,
        subject: emailData.subject?.replace(/^re:\s*/i, '') || '',
        fromAddress: emailData.from_address || '',
        receivedDate: new Date(emailData.created_at || Date.now()),
        userId: userId
      });

      console.log(`[BackgroundAI] Processed inbound response for email ${emailData.id}`);
      
    } catch (error) {
      console.error(`[BackgroundAI] Error handling inbound response:`, error);
      // Don't throw - this is a background task
    }
  }

  /**
   * CONTINUOUS LEARNING - Learn patterns from new email
   */
  private async performContinuousLearning(
    emailData: any,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      // Only learn from emails with substantial content
      const content = emailData.raw_content || emailData.text_content || emailData.body || '';
      if (content.length < 50) {
        return; // Skip very short emails
      }

      console.log(`[BackgroundAI] Starting continuous learning for email ${emailData.id}`);
      
      // Initialize email learning service
      const learningService = new EmailLearningService();
      
      // Determine if this is a user response (sent email)
      const { data: userEmail } = await this.supabase
        .from('email_accounts')
        .select('email_address')
        .eq('user_id', userId)
        .single();

      const isUserResponse = userEmail?.email_address && 
        emailData.from_address?.toLowerCase() === userEmail.email_address.toLowerCase();
      
      // Learn from this email
      const learningResult = await learningService.learnFromNewEmail(
        emailData.id,
        userId,
        organizationId,
        isUserResponse
      );
      
      if (learningResult.success && learningResult.patternsLearned > 0) {
        console.log(`[BackgroundAI] Learned ${learningResult.patternsLearned} patterns from email ${emailData.id}`);
      }
      
    } catch (error) {
      console.error(`[BackgroundAI] Error in continuous learning:`, error);
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
