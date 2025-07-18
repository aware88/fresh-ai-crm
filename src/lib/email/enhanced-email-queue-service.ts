/**
 * Enhanced Email Queue Service
 * 
 * Integrates with AI Hub for email processing with organization-specific settings
 */

import { AIHubService, EmailProcessingContext } from '@/lib/ai/ai-hub-service';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { EmailQueueStatus } from './emailQueueService';

export interface EnhancedEmailQueueItem {
  id: string;
  email_id: string;
  organization_id: string;
  contact_id?: string;
  status: EmailQueueStatus;
  priority: 'high' | 'medium' | 'low';
  email_type: 'customer_service' | 'sales' | 'product_inquiry' | 'complaint' | 'general';
  scheduled_at: string;
  processing_attempts: number;
  last_processed_at?: string;
  error_message?: string;
  metadata?: {
    delay_minutes?: number;
    classification_confidence?: number;
    requires_human_review?: boolean;
    ai_response_id?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Related data
  email?: {
    id: string;
    subject: string;
    body: string;
    sender: string;
    recipient: string;
    raw_content: string;
    created_at: string;
  };
  
  contact?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    company?: string;
  };
}

export class EnhancedEmailQueueService {
  private aiHub: AIHubService;
  private settingsService: OrganizationSettingsService;
  private supabase: ReturnType<typeof createLazyServerClient>;

  constructor() {
    this.aiHub = new AIHubService();
    this.settingsService = new OrganizationSettingsService();
    this.supabase = createLazyServerClient();
  }

  /**
   * Process incoming email and add to queue with appropriate delay
   */
  async processIncomingEmail(
    emailId: string,
    organizationId: string,
    userId: string,
    contactId?: string
  ): Promise<void> {
    console.log(`[Enhanced Email Queue] Processing incoming email ${emailId}`);

    const supabase = await this.supabase;

    try {
      // Get email data
      const { data: email, error: emailError } = await supabase
        .from('emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (emailError || !email) {
        throw new Error(`Email not found: ${emailError?.message}`);
      }

      // Classify email using AI Hub
      const classification = await this.aiHub.classifyEmail(
        email.body || email.raw_content,
        email.subject,
        organizationId
      );

      // Get appropriate delay for this email type
      const delayMinutes = classification.type === 'general' ? 0 : await this.aiHub.getEmailDelay(
        organizationId,
        classification.type
      );

      // Calculate scheduled time
      const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      // Add to enhanced queue
      const { error: queueError } = await supabase
        .from('email_queue')
        .insert({
          email_id: emailId,
          organization_id: organizationId,
          contact_id: contactId,
          status: EmailQueueStatus.PENDING,
          priority: this.getPriorityFromClassification(classification),
          email_type: classification.type,
          scheduled_at: scheduledAt.toISOString(),
          processing_attempts: 0,
          metadata: {
            delay_minutes: delayMinutes,
            classification_confidence: classification.confidence,
            classification_reasoning: classification.reasoning,
            urgency: classification.urgency,
            sentiment: classification.sentiment,
            extracted_entities: classification.extractedEntities,
            requires_human_review: classification.urgency === 'high' || classification.sentiment === 'negative'
          },
          created_by: userId
        });

      if (queueError) {
        throw new Error(`Failed to add email to queue: ${queueError.message}`);
      }

      console.log(`[Enhanced Email Queue] Email ${emailId} scheduled for processing at ${scheduledAt.toISOString()}`);

      // If no delay, process immediately
      if (delayMinutes === 0) {
        await this.processQueueItem(emailId, organizationId, userId);
      }

    } catch (error) {
      console.error(`[Enhanced Email Queue] Error processing incoming email:`, error);
      throw error;
    }
  }

  /**
   * Process a queued email item
   */
  async processQueueItem(emailId: string, organizationId: string, userId: string): Promise<void> {
    console.log(`[Enhanced Email Queue] Processing queue item for email ${emailId}`);

    const supabase = await this.supabase;

    try {
      // Get queue item with related data
      const { data: queueItem, error: queueError } = await supabase
        .from('email_queue')
        .select(`
          *,
          emails!inner(*),
          contacts(*)
        `)
        .eq('email_id', emailId)
        .eq('organization_id', organizationId)
        .eq('status', EmailQueueStatus.PENDING)
        .single();

      if (queueError || !queueItem) {
        throw new Error(`Queue item not found: ${queueError?.message}`);
      }

      // Update status to processing
      await supabase
        .from('email_queue')
        .update({
          status: EmailQueueStatus.PROCESSING,
          processing_attempts: queueItem.processing_attempts + 1,
          last_processed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      // Build processing context
      const context: EmailProcessingContext = {
        emailId: emailId,
        organizationId: organizationId,
        userId: userId,
        emailContent: queueItem.emails.body || queueItem.emails.raw_content,
        emailSubject: queueItem.emails.subject,
        senderEmail: queueItem.emails.sender,
        senderName: queueItem.contacts?.first_name && queueItem.contacts?.last_name 
          ? `${queueItem.contacts.first_name} ${queueItem.contacts.last_name}`
          : undefined,
        emailType: queueItem.email_type,
        contactId: queueItem.contact_id,
        conversationHistory: await this.getConversationHistory(emailId, queueItem.contact_id),
        productMentions: queueItem.metadata?.extracted_entities?.products || [],
        orderReferences: queueItem.metadata?.extracted_entities?.orders || []
      };

      // Process with AI Hub
      const aiResult = await this.aiHub.processEmail(context);

      // Update queue item with results
      const finalStatus = aiResult.requiresHumanReview ? 
        EmailQueueStatus.REQUIRES_REVIEW : 
        EmailQueueStatus.COMPLETED;

      await supabase
        .from('email_queue')
        .update({
          status: finalStatus,
          metadata: {
            ...queueItem.metadata,
            ai_response_id: aiResult.responseId,
            ai_confidence: aiResult.confidence,
            ai_reasoning: aiResult.reasoning,
            requires_human_review: aiResult.requiresHumanReview,
            suggested_actions: aiResult.suggestedActions,
            product_recommendations: aiResult.productRecommendations,
            upselling_suggestions: aiResult.upsellingSuggestions,
            estimated_sentiment: aiResult.estimatedSentiment,
            processing_completed_at: new Date().toISOString()
          }
        })
        .eq('id', queueItem.id);

      // Store AI response if not requiring human review
      if (!aiResult.requiresHumanReview) {
        await this.storeAIResponse(queueItem, aiResult);
      }

      console.log(`[Enhanced Email Queue] Successfully processed email ${emailId}`);

    } catch (error) {
      console.error(`[Enhanced Email Queue] Error processing queue item:`, error);
      
      // Update queue item with error
      await supabase
        .from('email_queue')
        .update({
          status: EmailQueueStatus.FAILED,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_attempts: supabase.from('email_queue').select('processing_attempts').eq('email_id', emailId).single().then(({ data }) => (data?.processing_attempts || 0) + 1)
        })
        .eq('email_id', emailId);

      throw error;
    }
  }

  /**
   * Get the next batch of emails ready for processing
   */
  async getNextBatchForProcessing(
    organizationId: string,
    batchSize: number = 10
  ): Promise<EnhancedEmailQueueItem[]> {
    const supabase = await this.supabase;

    const { data: queueItems, error } = await supabase
      .from('email_queue')
      .select(`
        *,
        emails!inner(*),
        contacts(*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', EmailQueueStatus.PENDING)
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error('Error getting next batch for processing:', error);
      return [];
    }

    return queueItems || [];
  }

  /**
   * Process batch of emails for an organization
   */
  async processBatch(
    organizationId: string,
    userId: string,
    batchSize: number = 10
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    requiresReview: number;
    details: any[];
  }> {
    console.log(`[Enhanced Email Queue] Processing batch for organization ${organizationId}`);

         const results = {
       processed: 0,
       successful: 0,
       failed: 0,
       requiresReview: 0,
       details: [] as any[]
     };

    const queueItems = await this.getNextBatchForProcessing(organizationId, batchSize);

    for (const queueItem of queueItems) {
      try {
        await this.processQueueItem(queueItem.email_id, organizationId, userId);
        results.processed++;
        results.successful++;
        
        results.details.push({
          emailId: queueItem.email_id,
          success: true,
          status: 'completed'
        });
      } catch (error) {
        results.processed++;
        results.failed++;
        
        results.details.push({
          emailId: queueItem.email_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`[Enhanced Email Queue] Batch processing completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Get conversation history for better context
   */
  private async getConversationHistory(emailId: string, contactId?: string): Promise<any[]> {
    if (!contactId) return [];

    const supabase = await this.supabase;

    const { data: emails, error } = await supabase
      .from('emails')
      .select('id, subject, body, sender, recipient, created_at')
      .eq('contact_id', contactId)
      .neq('id', emailId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.warn('Error getting conversation history:', error);
      return [];
    }

    return emails || [];
  }

  /**
   * Store AI response for sending
   */
  private async storeAIResponse(queueItem: any, aiResult: any): Promise<void> {
    const supabase = await this.supabase;

    // Store the AI-generated response
    await supabase
      .from('email_responses')
      .insert({
        email_id: queueItem.email_id,
        response_content: aiResult.response,
        response_type: 'ai_generated',
        confidence: aiResult.confidence,
        requires_approval: aiResult.requiresHumanReview,
        metadata: {
          ai_response_id: aiResult.responseId,
          suggested_actions: aiResult.suggestedActions,
          product_recommendations: aiResult.productRecommendations,
          upselling_suggestions: aiResult.upsellingSuggestions
        },
        created_by: queueItem.created_by,
        organization_id: queueItem.organization_id
      });

    console.log(`[Enhanced Email Queue] AI response stored for email ${queueItem.email_id}`);
  }

  /**
   * Get priority from classification
   */
  private getPriorityFromClassification(classification: any): 'high' | 'medium' | 'low' {
    if (classification.urgency === 'high' || classification.type === 'complaint') {
      return 'high';
    }
    if (classification.urgency === 'medium' || classification.type === 'sales') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get queue statistics for an organization
   */
  async getQueueStats(organizationId: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    requiresReview: number;
    avgProcessingTime: number;
  }> {
    const supabase = await this.supabase;

    const { data: stats, error } = await supabase
      .from('email_queue')
      .select('status, processing_attempts, created_at, last_processed_at')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error getting queue stats:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        requiresReview: 0,
        avgProcessingTime: 0
      };
    }

    const statsData = stats || [];
    const statusCounts = statsData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as any);

    // Calculate average processing time
    const completedItems = statsData.filter(item => 
      item.status === EmailQueueStatus.COMPLETED && item.last_processed_at
    );
    
    const avgProcessingTime = completedItems.length > 0 
      ? completedItems.reduce((acc, item) => {
          const startTime = new Date(item.created_at).getTime();
          const endTime = new Date(item.last_processed_at).getTime();
          return acc + (endTime - startTime);
        }, 0) / completedItems.length
      : 0;

    return {
      pending: statusCounts[EmailQueueStatus.PENDING] || 0,
      processing: statusCounts[EmailQueueStatus.PROCESSING] || 0,
      completed: statusCounts[EmailQueueStatus.COMPLETED] || 0,
      failed: statusCounts[EmailQueueStatus.FAILED] || 0,
      requiresReview: statusCounts[EmailQueueStatus.REQUIRES_REVIEW] || 0,
      avgProcessingTime: Math.round(avgProcessingTime / 1000) // Convert to seconds
    };
  }
} 