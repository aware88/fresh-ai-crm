/**
 * Email Queue Service
 * 
 * This service manages the email queue system for incoming emails,
 * including adding emails to the queue, processing queued emails,
 * and managing the queue lifecycle.
 */

import { createServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { EmailAnalyzerService } from './email-analyzer';
import { buildEmailProcessingContext } from '@/lib/ai/email-context-builder';
import { logger } from '@/lib/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export enum EmailQueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum EmailPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface QueueItem {
  id: string;
  email_id: string;
  contact_id?: string;
  status: EmailQueueStatus;
  priority: EmailPriority;
  processing_attempts: number;
  last_processed_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  organization_id?: string;
  requires_manual_review: boolean;
  assigned_to?: string;
  due_at?: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  review: number;
  approved: number;
  rejected: number;
}

export class EmailQueueService {
  private supabasePromise;
  private emailAnalyzer: EmailAnalyzerService;
  
  constructor() {
    this.supabasePromise = createServerClient();
    this.emailAnalyzer = new EmailAnalyzerService();
  }
  
  /**
   * Get initialized Supabase client
   */
  private async getSupabase() {
    return await this.supabasePromise;
  }
  
  /**
   * Add an email to the processing queue
   */
  async addToQueue(emailId: string, contactId?: string, priority: EmailPriority = EmailPriority.MEDIUM, userId?: string, organizationId?: string): Promise<QueueItem> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        email_id: emailId,
        contact_id: contactId,
        status: EmailQueueStatus.PENDING,
        priority,
        created_by: userId,
        organization_id: organizationId
      })
      .select('*')
      .single();
      
    if (error) {
      logger.error('Failed to add email to queue', error, { emailId, priority, metadata });
      throw new Error(`Failed to add email to queue: ${error.message}`);
    }
    
    return data as QueueItem;
  }
  
  /**
   * Get queue items with optional filtering
   */
  async getQueueItems(options: {
    status?: EmailQueueStatus;
    priority?: EmailPriority;
    contactId?: string;
    userId?: string;
    organizationId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<QueueItem[]> {
    const {
      status,
      priority,
      contactId,
      userId,
      organizationId,
      limit = 100,
      offset = 0
    } = options;
    
    const supabase = await this.getSupabase();
    let query = supabase
      .from('email_queue')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)
      .range(offset, offset + limit - 1);
      
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }
    
    if (userId) {
      query = query.eq('created_by', userId);
    }
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Failed to fetch queue items', error, { status, limit });
      throw new Error(`Failed to fetch queue items: ${error.message}`);
    }
    
    return data as QueueItem[];
  }
  
  /**
   * Process a queued email
   */
  async processQueuedEmail(queueItemId: string): Promise<{
    status: EmailQueueStatus;
    requiresReview: boolean;
    error?: string;
  }> {
    try {
      // Update status to processing
      const supabase = await this.getSupabase();
      const { data: queueItem, error: updateError } = await supabase
        .from('email_queue')
        .update({
          status: EmailQueueStatus.PROCESSING,
          processing_attempts: 1, // Simplified - in production, increment properly
          last_processed_at: new Date().toISOString()
        })
        .eq('id', queueItemId)
        .select('*')
        .single();
        
      if (updateError) {
        throw new Error(`Failed to update queue item status: ${updateError.message}`);
      }
      
      // Get the email data
      const { data: email, error: emailError } = await supabase
        .from('emails')
        .select('*, contacts(*)')
        .eq('id', queueItem.email_id)
        .single();
        
      if (emailError) {
        throw new Error(`Failed to fetch email data: ${emailError.message}`);
      }
      
      // Analyze the email content
      const analysis = await this.emailAnalyzer.analyzeEmail(email.raw_content, email.subject);
      
      // Build AI context for the email
      const context = await buildEmailProcessingContext(email.id);
      
      // Determine if manual review is required
      const requiresReview = this.determineIfReviewNeeded(analysis, email);
      
      // Update the queue item with analysis results
      const { error: finalUpdateError } = await (await this.getSupabase())
        .from('email_queue')
        .update({
          status: requiresReview ? EmailQueueStatus.REVIEW : EmailQueueStatus.COMPLETED,
          requires_manual_review: requiresReview,
          metadata: {
            analysis,
            context
          }
        })
        .eq('id', queueItemId);
        
      if (finalUpdateError) {
        throw new Error(`Failed to update queue item with results: ${finalUpdateError.message}`);
      }
      
      return {
        status: requiresReview ? EmailQueueStatus.REVIEW : EmailQueueStatus.COMPLETED,
        requiresReview
      };
    } catch (error: unknown) {
      logger.error(`Error processing queue item`, error, { queueItemId });
      
      // Update the queue item with error information
      await (await this.getSupabase())
        .from('email_queue')
        .update({
          status: EmailQueueStatus.FAILED,
          error_message: error.message
        })
        .eq('id', queueItemId);
      
      return {
        status: EmailQueueStatus.FAILED,
        requiresReview: false,
        error: error.message
      };
    }
  }
  
  /**
   * Review an email response
   */
  async reviewEmailResponse(queueItemId: string, approved: boolean, feedback?: string): Promise<QueueItem> {
    const status = approved ? EmailQueueStatus.APPROVED : EmailQueueStatus.REJECTED;
    
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('email_queue')
      .update({
        status,
        metadata: {
          review: {
            approved,
            feedback,
            reviewedAt: new Date().toISOString()
          }
        }
      })
      .eq('id', queueItemId)
      .select('*')
      .single();
      
    if (error) {
      logger.error('Failed to review email response', error, { queueItemId, action });
      throw new Error(`Failed to review email response: ${error.message}`);
    }
    
    return data as QueueItem;
  }
  
  /**
   * Delete a queue item
   */
  async deleteQueueItem(queueItemId: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('email_queue')
      .delete()
      .eq('id', queueItemId);
      
    if (error) {
      logger.error('Failed to delete queue item', error, { queueItemId });
      throw new Error(`Failed to delete queue item: ${error.message}`);
    }
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(organizationId?: string): Promise<QueueStats> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.rpc('get_email_queue_stats', { org_id: organizationId });
    
    if (error) {
      logger.error('Failed to get queue statistics', error);
      throw new Error(`Failed to get queue statistics: ${error.message}`);
    }
    
    return data as QueueStats;
  }
  
  /**
   * Reset failed queue items to pending status
   */
  async resetFailedQueueItems(maxAttempts: number = 3, organizationId?: string): Promise<number> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.rpc('reset_failed_queue_items', {
      max_attempts: maxAttempts,
      org_id: organizationId
    });
    
    if (error) {
      logger.error('Failed to reset failed queue items', error);
      throw new Error(`Failed to reset failed queue items: ${error.message}`);
    }
    
    return data as number;
  }
  
  /**
   * Clean up old completed queue items
   */
  async cleanupOldQueueItems(daysToKeep: number = 30, organizationId?: string): Promise<number> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase.rpc('cleanup_old_queue_items', {
      days_to_keep: daysToKeep,
      org_id: organizationId
    });
    
    if (error) {
      logger.error('Failed to clean up old queue items', error, { cutoffDate });
      throw new Error(`Failed to clean up old queue items: ${error.message}`);
    }
    
    return data as number;
  }
  
  /**
   * Process the next batch of pending emails
   */
  async processPendingEmails(batchSize: number = 10, organizationId?: string): Promise<{
    processed: number;
    requireReview: number;
    completed: number;
    failed: number;
  }> {
    const pendingItems = await this.getQueueItems({
      status: EmailQueueStatus.PENDING,
      organizationId,
      limit: batchSize
    });
    
    const results = {
      processed: pendingItems.length,
      requireReview: 0,
      completed: 0,
      failed: 0
    };
    
    for (const item of pendingItems) {
      try {
        const result = await this.processQueuedEmail(item.id);
        
        if (result.status === EmailQueueStatus.REVIEW) {
          results.requireReview++;
        } else if (result.status === EmailQueueStatus.COMPLETED) {
          results.completed++;
        } else if (result.status === EmailQueueStatus.FAILED) {
          results.failed++;
        }
      } catch (error: unknown) {
        logger.error('Error processing queue item in batch', error, { queueItemId: item.id });
        results.failed++;
      }
    }
    
    return results;
  }
  
  /**
   * Determine if an email requires manual review
   */
  private determineIfReviewNeeded(analysis: Record<string, unknown>, email: Record<string, unknown>): boolean {
    // Logic to determine if manual review is needed
    // This could be based on sentiment, complexity, specific keywords, etc.
    
    // Example logic:
    // 1. If sentiment is very negative, require review
    if (analysis.sentiment && analysis.sentiment.score < -0.7) {
      return true;
    }
    
    // 2. If email contains urgent or high-priority keywords
    const urgentKeywords = ['urgent', 'immediately', 'asap', 'emergency', 'critical'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      email.subject?.toLowerCase().includes(keyword) || 
      email.raw_content?.toLowerCase().includes(keyword)
    );
    
    if (hasUrgentKeywords) {
      return true;
    }
    
    // 3. If email is very complex or long
    if (email.raw_content && email.raw_content.length > 1000) {
      return true;
    }
    
    // 4. If confidence in AI analysis is low
    if (analysis.confidence && analysis.confidence < 0.7) {
      return true;
    }
    
    return false;
  }
}