/**
 * Email Follow-up Service
 * 
 * Manages email follow-up tracking, detection, and automation
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailFollowup {
  id?: string;
  email_id: string;
  user_id: string;
  organization_id?: string;
  original_sent_at: string;
  follow_up_due_at: string;
  follow_up_sent_at?: string;
  response_received_at?: string;
  status: 'pending' | 'due' | 'overdue' | 'completed' | 'cancelled';
  follow_up_type: 'manual' | 'auto' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  original_subject: string;
  original_recipients: string[];
  context_summary?: string;
  follow_up_reason?: string;
  ai_draft_subject?: string;
  ai_draft_content?: string;
  ai_draft_generated_at?: string;
  ai_draft_approved?: boolean;
  metadata?: Record<string, any>;
  reminder_count?: number;
  last_reminder_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FollowupReminder {
  id?: string;
  followup_id: string;
  user_id: string;
  reminder_type: 'notification' | 'email' | 'dashboard';
  reminder_time: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error_message?: string;
  reminder_title: string;
  reminder_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FollowupStats {
  total_followups: number;
  pending_followups: number;
  due_followups: number;
  overdue_followups: number;
  completed_followups: number;
  response_rate: number;
}

export interface CreateFollowupOptions {
  emailId: string;
  userId: string;
  organizationId?: string;
  originalSentAt: Date;
  followUpDays?: number; // Default: 3 days
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  followUpType?: 'manual' | 'auto' | 'scheduled';
  originalSubject: string;
  originalRecipients: string[];
  contextSummary?: string;
  followUpReason?: string;
  metadata?: Record<string, any>;
}

export class FollowUpService {
  private supabase: SupabaseClient | null = null;
  private initPromise: Promise<SupabaseClient> | null = null;

  constructor() {
    this.initSupabase();
  }
  
  private async initSupabase(): Promise<SupabaseClient> {
    if (this.supabase) return this.supabase;
    
    if (!this.initPromise) {
      this.initPromise = createLazyServerClient().then(client => {
        this.supabase = client;
        return client;
      });
    }
    
    return this.initPromise;
  }
  
  private async getClient(): Promise<SupabaseClient> {
    return await this.initSupabase();
  }

  /**
   * Create a new follow-up tracking record
   */
  async createFollowup(options: CreateFollowupOptions): Promise<EmailFollowup | null> {
    try {
      const client = await this.getClient();
      
      const followUpDays = options.followUpDays || 3;
      const followUpDueAt = new Date(options.originalSentAt);
      followUpDueAt.setDate(followUpDueAt.getDate() + followUpDays);

      const followupData: Partial<EmailFollowup> = {
        email_id: options.emailId,
        user_id: options.userId,
        organization_id: options.organizationId,
        original_sent_at: options.originalSentAt.toISOString(),
        follow_up_due_at: followUpDueAt.toISOString(),
        status: 'pending',
        follow_up_type: options.followUpType || 'manual',
        priority: options.priority || 'medium',
        original_subject: options.originalSubject,
        original_recipients: options.originalRecipients,
        context_summary: options.contextSummary,
        follow_up_reason: options.followUpReason,
        metadata: options.metadata || {},
        reminder_count: 0
      };

      const { data, error } = await client
        .from('email_followups')
        .insert(followupData)
        .select()
        .single();

      if (error) {
        console.error('Error creating follow-up:', error);
        return null;
      }

      // Create initial reminder
      await this.createReminder({
        followupId: data.id,
        userId: options.userId,
        reminderType: 'dashboard',
        reminderTime: followUpDueAt,
        reminderTitle: `Follow-up due: ${options.originalSubject}`,
        reminderMessage: `No response received to your email "${options.originalSubject}". Consider sending a follow-up.`
      });

      return data as EmailFollowup;
    } catch (error) {
      console.error('Error in createFollowup:', error);
      return null;
    }
  }

  /**
   * Get follow-ups for a user with optional filtering
   */
  async getFollowups(
    userId: string,
    options?: {
      status?: string[];
      priority?: string[];
      limit?: number;
      organizationId?: string;
    }
  ): Promise<EmailFollowup[]> {
    try {
      const client = await this.getClient();
      
      let query = client
        .from('email_followups')
        .select(`
          *,
          emails:email_id (
            id,
            subject,
            from_email,
            to_email,
            sent_at,
            message_id
          )
        `)
        .eq('user_id', userId)
        .order('follow_up_due_at', { ascending: true });

      if (options?.status?.length) {
        query = query.in('status', options.status);
      }

      if (options?.priority?.length) {
        query = query.in('priority', options.priority);
      }

      if (options?.organizationId) {
        query = query.eq('organization_id', options.organizationId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching follow-ups:', error);
        return [];
      }

      return data as EmailFollowup[];
    } catch (error) {
      console.error('Error in getFollowups:', error);
      return [];
    }
  }

  /**
   * Get follow-ups that are due or overdue
   */
  async getDueFollowups(userId: string, organizationId?: string): Promise<EmailFollowup[]> {
    return this.getFollowups(userId, {
      status: ['due', 'overdue'],
      organizationId
    });
  }

  /**
   * Update follow-up status
   */
  async updateFollowupStatus(
    followupId: string,
    status: EmailFollowup['status'],
    additionalData?: Partial<EmailFollowup>
  ): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { error } = await client
        .from('email_followups')
        .update(updateData)
        .eq('id', followupId);

      if (error) {
        console.error('Error updating follow-up status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateFollowupStatus:', error);
      return false;
    }
  }

  /**
   * Mark follow-up as completed (response received)
   */
  async markFollowupCompleted(followupId: string, responseReceivedAt?: Date): Promise<boolean> {
    return this.updateFollowupStatus(followupId, 'completed', {
      response_received_at: (responseReceivedAt || new Date()).toISOString()
    });
  }

  /**
   * Mark follow-up as sent
   */
  async markFollowupSent(followupId: string, sentAt?: Date): Promise<boolean> {
    return this.updateFollowupStatus(followupId, 'completed', {
      follow_up_sent_at: (sentAt || new Date()).toISOString()
    });
  }

  /**
   * Cancel a follow-up
   */
  async cancelFollowup(followupId: string): Promise<boolean> {
    return this.updateFollowupStatus(followupId, 'cancelled');
  }

  /**
   * Create a reminder for a follow-up
   */
  async createReminder(options: {
    followupId: string;
    userId: string;
    reminderType: 'notification' | 'email' | 'dashboard';
    reminderTime: Date;
    reminderTitle: string;
    reminderMessage?: string;
  }): Promise<FollowupReminder | null> {
    try {
      const client = await this.getClient();
      
      const reminderData: Partial<FollowupReminder> = {
        followup_id: options.followupId,
        user_id: options.userId,
        reminder_type: options.reminderType,
        reminder_time: options.reminderTime.toISOString(),
        status: 'pending',
        reminder_title: options.reminderTitle,
        reminder_message: options.reminderMessage
      };

      const { data, error } = await client
        .from('email_followup_reminders')
        .insert(reminderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating reminder:', error);
        return null;
      }

      return data as FollowupReminder;
    } catch (error) {
      console.error('Error in createReminder:', error);
      return null;
    }
  }

  /**
   * Get pending reminders for a user
   */
  async getPendingReminders(userId: string): Promise<FollowupReminder[]> {
    try {
      const client = await this.getClient();
      
      const { data, error } = await client
        .from('email_followup_reminders')
        .select(`
          *,
          email_followups (
            id,
            original_subject,
            original_recipients,
            priority,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lte('reminder_time', new Date().toISOString())
        .order('reminder_time', { ascending: true });

      if (error) {
        console.error('Error fetching pending reminders:', error);
        return [];
      }

      return data as FollowupReminder[];
    } catch (error) {
      console.error('Error in getPendingReminders:', error);
      return [];
    }
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(reminderId: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      const { error } = await client
        .from('email_followup_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error marking reminder as sent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markReminderSent:', error);
      return false;
    }
  }

  /**
   * Get follow-up statistics for a user
   */
  async getFollowupStats(userId: string): Promise<FollowupStats> {
    try {
      const client = await this.getClient();
      
      const { data, error } = await client
        .rpc('get_followup_stats', { user_uuid: userId });

      if (error) {
        console.error('Error fetching follow-up stats:', error);
        return {
          total_followups: 0,
          pending_followups: 0,
          due_followups: 0,
          overdue_followups: 0,
          completed_followups: 0,
          response_rate: 0
        };
      }

      return data[0] as FollowupStats;
    } catch (error) {
      console.error('Error in getFollowupStats:', error);
      return {
        total_followups: 0,
        pending_followups: 0,
        due_followups: 0,
        overdue_followups: 0,
        completed_followups: 0,
        response_rate: 0
      };
    }
  }

  /**
   * Auto-track sent emails for follow-up
   * This should be called whenever an email is sent
   */
  async trackSentEmail(options: {
    emailId: string;
    userId: string;
    organizationId?: string;
    subject: string;
    recipients: string[];
    sentAt: Date;
    autoFollowup?: boolean;
    followUpDays?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<EmailFollowup | null> {
    try {
      // Only create follow-up if auto-follow-up is enabled or explicitly requested
      if (!options.autoFollowup) {
        return null;
      }

      // Don't create follow-ups for auto-replies or out-of-office messages
      if (this.isAutoReplySubject(options.subject)) {
        return null;
      }

      return await this.createFollowup({
        emailId: options.emailId,
        userId: options.userId,
        organizationId: options.organizationId,
        originalSentAt: options.sentAt,
        followUpDays: options.followUpDays || 3,
        priority: options.priority || 'medium',
        followUpType: 'auto',
        originalSubject: options.subject,
        originalRecipients: options.recipients,
        contextSummary: `Automatically tracked sent email`,
        followUpReason: 'No response received',
        metadata: {
          auto_tracked: true,
          tracking_enabled_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in trackSentEmail:', error);
      return null;
    }
  }

  /**
   * Check if a subject line indicates an auto-reply
   */
  private isAutoReplySubject(subject: string): boolean {
    const autoReplyPatterns = [
      /^(re:|fwd?:|fw:)/i,
      /out of office/i,
      /automatic reply/i,
      /auto.?reply/i,
      /vacation/i,
      /away/i,
      /unsubscribe/i
    ];

    return autoReplyPatterns.some(pattern => pattern.test(subject));
  }

  /**
   * Process response detection
   * This should be called when new emails are received
   */
  async processIncomingEmail(email: {
    id: string;
    messageId?: string;
    threadId?: string;
    subject: string;
    fromAddress: string;
    receivedDate: Date;
    userId: string;
  }): Promise<void> {
    try {
      // The database trigger should handle most of this automatically,
      // but we can add additional AI-based response detection here
      
      // For now, we rely on the database trigger
      // Future enhancement: Add AI analysis to determine if this is a meaningful response
      console.log(`Processing incoming email for follow-up detection: ${email.subject}`);
    } catch (error) {
      console.error('Error in processIncomingEmail:', error);
    }
  }

  /**
   * Snooze a follow-up to a later date
   */
  async snoozeFollowup(followupId: string, snoozeUntil: Date): Promise<boolean> {
    return this.updateFollowupStatus(followupId, 'pending', {
      follow_up_due_at: snoozeUntil.toISOString(),
      reminder_count: 0,
      last_reminder_at: null
    });
  }

  /**
   * Get follow-ups by email ID
   */
  async getFollowupsByEmailId(emailId: string): Promise<EmailFollowup[]> {
    try {
      const client = await this.getClient();
      
      const { data, error } = await client
        .from('email_followups')
        .select('*')
        .eq('email_id', emailId);

      if (error) {
        console.error('Error fetching follow-ups by email ID:', error);
        return [];
      }

      return data as EmailFollowup[];
    } catch (error) {
      console.error('Error in getFollowupsByEmailId:', error);
      return [];
    }
  }

  /**
   * Bulk update follow-up statuses
   */
  async bulkUpdateFollowups(
    followupIds: string[],
    updates: Partial<EmailFollowup>
  ): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      const { error } = await client
        .from('email_followups')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', followupIds);

      if (error) {
        console.error('Error in bulk update follow-ups:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in bulkUpdateFollowups:', error);
      return false;
    }
  }
}
