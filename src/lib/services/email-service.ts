import { createClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';

export interface EmailQueueItem {
  id?: string;
  email_id?: string;
  contact_id?: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  priority: 'high' | 'medium' | 'low';
  processing_attempts?: number;
  last_processed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  organization_id?: string;
  requires_manual_review?: boolean;
  assigned_to?: string;
  due_at?: string;
  subject: string;
  body: string;
  recipient_email: string;
  recipient_name?: string;
}

export class EmailService {
  /**
   * Queue an email to be sent
   */
  async queueEmail(email: Omit<EmailQueueItem, 'id' | 'status' | 'priority' | 'processing_attempts' | 'created_at'>): Promise<{ data: EmailQueueItem | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        ...email,
        status: 'pending',
        priority: email.priority || 'medium',
        processing_attempts: 0
      })
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Queue a notification email
   */
  async queueNotificationEmail({
    userId,
    organizationId,
    subject,
    body,
    metadata = {}
  }: {
    userId: string;
    organizationId: string;
    subject: string;
    body: string;
    metadata?: Record<string, any>;
  }): Promise<{ data: EmailQueueItem | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return { data: null, error: userError || new Error('User not found') as PostgrestError };
    }
    
    return this.queueEmail({
      recipient_email: user.email,
      recipient_name: user.display_name,
      subject,
      body,
      metadata: {
        notification: true,
        ...metadata
      },
      created_by: userId,
      organization_id: organizationId
    });
  }

  /**
   * Get emails for an organization
   */
  async getOrganizationEmails(organizationId: string, limit = 20): Promise<{ data: EmailQueueItem[] | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }

  /**
   * Get emails for a user
   */
  async getUserEmails(userId: string, limit = 20): Promise<{ data: EmailQueueItem[] | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }
}
