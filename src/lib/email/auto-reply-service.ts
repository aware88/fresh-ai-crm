import { createClient } from '@supabase/supabase-js';
import { UnifiedAIDraftingService } from '../ai/unified-drafting-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AutoReplySettings {
  enabled: boolean;
  delayMinutes: number;
  enabledAgents: string[];
  excludeUrgent: boolean;
  excludeDisputes: boolean;
  requireConfirmation: boolean;
  maxDailyReplies: number;
}

export interface PendingReply {
  id: string;
  emailId: string;
  userEmail: string;
  draftContent: string;
  scheduledAt: string;
  agentType: string;
  priority: string;
  status: 'pending' | 'approved' | 'sent' | 'cancelled';
  createdAt: string;
}

export class AutoReplyService {
  private static instance: AutoReplyService;
  private draftingService: UnifiedAIDraftingService | null = null;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // draftingService will be initialized when needed with proper context
  }

  public static getInstance(): AutoReplyService {
    if (!AutoReplyService.instance) {
      AutoReplyService.instance = new AutoReplyService();
    }
    return AutoReplyService.instance;
  }

  /**
   * Process new email for potential auto-reply
   */
  async processEmailForAutoReply(emailId: string, emailData: any, userEmail: string): Promise<void> {
    try {
      // Get user's auto-reply settings
      const settings = await this.getUserAutoReplySettings(userEmail);
      
      if (!settings.enabled) {
        return;
      }

      // Check if this email qualifies for auto-reply
      const shouldAutoReply = await this.shouldAutoReply(emailData, settings);
      
      if (!shouldAutoReply) {
        console.log(`Email ${emailId} does not qualify for auto-reply`);
        return;
      }

      // Get user and organization IDs for drafting context
      const { data: userData } = await supabase
        .from('user_preferences')
        .select('user_id, current_organization_id')
        .eq('user_id', emailData.userId || emailData.created_by)
        .single();

      if (!userData?.user_id) {
        console.log(`No user data found for email ${emailId}`);
        return;
      }

      // Generate AI draft
      const draft = await this.generateAutoDraft(
        emailData, 
        userData.user_id, 
        userData.current_organization_id || ''
      );
      
      if (!draft) {
        console.log(`Failed to generate auto-draft for email ${emailId}`);
        return;
      }

      // Schedule the reply
      await this.scheduleReply(emailId, userEmail, draft, settings);

    } catch (error) {
      console.error(`Failed to process email ${emailId} for auto-reply:`, error);
    }
  }

  /**
   * Check if email should receive auto-reply
   */
  private async shouldAutoReply(emailData: any, settings: AutoReplySettings): Promise<boolean> {
    // Check if agent type is enabled
    if (!settings.enabledAgents.includes(emailData.agentType || 'auto_reply')) {
      return false;
    }

    // Exclude urgent emails if setting is enabled
    if (settings.excludeUrgent && (emailData.priority === 'urgent' || emailData.priority === 'high')) {
      return false;
    }

    // Exclude disputes if setting is enabled
    if (settings.excludeDisputes && emailData.agentType === 'dispute') {
      return false;
    }

    // Check daily reply limit
    const todayReplies = await this.getTodayReplyCount(emailData.userEmail);
    if (todayReplies >= settings.maxDailyReplies) {
      return false;
    }

    return true;
  }

  /**
   * Initialize drafting service with proper context
   */
  private async initializeDraftingService(userId: string, organizationId: string) {
    if (!this.draftingService) {
      const { createClient } = await import('@supabase/supabase-js');
      const OpenAI = (await import('openai')).default;
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });
      
      this.draftingService = new UnifiedAIDraftingService(
        supabase,
        openai,
        organizationId,
        userId
      );
    }
  }

  /**
   * Generate AI draft for auto-reply
   */
  private async generateAutoDraft(emailData: any, userId: string, organizationId: string): Promise<string | null> {
    try {
      // Initialize drafting service with proper context
      await this.initializeDraftingService(userId, organizationId);
      
      if (!this.draftingService) {
        throw new Error('Failed to initialize drafting service');
      }

      const draftContext = {
        emailId: emailData.id || `auto-reply-${Date.now()}`,
        originalEmail: {
          from: emailData.from,
          to: emailData.to || emailData.userEmail,
          subject: emailData.subject,
          body: emailData.body,
          date: emailData.date
        },
        userId,
        organizationId,
        settings: {
          responseStyle: 'professional' as const,
          responseLength: 'concise' as const,
          includeContext: true
        },
        customInstructions: 'Generate a polite auto-reply response'
      };

      const draftResult = await this.draftingService.generateDraft(draftContext);
      
      return draftResult.success ? draftResult.draft?.body || null : null;
    } catch (error) {
      console.error('Failed to generate auto-draft:', error);
      return null;
    }
  }

  /**
   * Schedule reply to be sent after delay
   */
  private async scheduleReply(
    emailId: string, 
    userEmail: string, 
    draftContent: string, 
    settings: AutoReplySettings
  ): Promise<void> {
    const scheduledAt = new Date(Date.now() + settings.delayMinutes * 60 * 1000);
    
    // Store pending reply in database
    const { data: pendingReply, error } = await supabase
      .from('pending_auto_replies')
      .insert({
        email_id: emailId,
        user_email: userEmail,
        draft_content: draftContent,
        scheduled_at: scheduledAt.toISOString(),
        agent_type: 'auto_reply',
        priority: 'normal',
        status: settings.requireConfirmation ? 'pending' : 'approved'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If no confirmation required, schedule immediate sending
    if (!settings.requireConfirmation) {
      this.scheduleTimer(pendingReply.id, scheduledAt);
    }

    console.log(`Auto-reply scheduled for email ${emailId} at ${scheduledAt.toISOString()}`);
  }

  /**
   * Schedule timer for sending reply
   */
  private scheduleTimer(replyId: string, scheduledAt: Date): void {
    const delay = scheduledAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // Send immediately if time has passed
      this.sendScheduledReply(replyId);
      return;
    }

    const timer = setTimeout(() => {
      this.sendScheduledReply(replyId);
      this.timers.delete(replyId);
    }, delay);

    this.timers.set(replyId, timer);
  }

  /**
   * Send scheduled reply
   */
  private async sendScheduledReply(replyId: string): Promise<void> {
    try {
      // Get pending reply
      const { data: pendingReply, error } = await supabase
        .from('pending_auto_replies')
        .select('*')
        .eq('id', replyId)
        .eq('status', 'approved')
        .single();

      if (error || !pendingReply) {
        console.log(`Pending reply ${replyId} not found or not approved`);
        return;
      }

      // Send the email (integrate with your email sending service)
      await this.sendEmail(pendingReply);

      // Mark as sent
      await supabase
        .from('pending_auto_replies')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', replyId);

      console.log(`Auto-reply ${replyId} sent successfully`);

    } catch (error) {
      console.error(`Failed to send auto-reply ${replyId}:`, error);
      
      // Mark as failed
      await supabase
        .from('pending_auto_replies')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', replyId);
    }
  }

  /**
   * Send email using appropriate service
   */
  private async sendEmail(pendingReply: any): Promise<void> {
    try {
      // Get the original email to determine the account type and reply details
      const { data: originalEmail } = await supabase
        .from('emails')
        .select('*')
        .eq('id', pendingReply.email_id)
        .single();

      if (!originalEmail) {
        throw new Error('Original email not found');
      }

      // Get the email account details
      const { data: account } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('email', pendingReply.user_email)
        .single();

      if (!account) {
        throw new Error('Email account not found');
      }

      const replyData = {
        to: originalEmail.sender || originalEmail.from,
        subject: originalEmail.subject?.startsWith('Re:') 
          ? originalEmail.subject 
          : `Re: ${originalEmail.subject}`,
        body: pendingReply.draft_content,
        replyToMessageId: originalEmail.message_id
      };

      // Send via appropriate service based on account type
      switch (account.provider) {
        case 'outlook':
          await this.sendOutlookReply(account, replyData);
          break;
        case 'google':
        case 'gmail':
          await this.sendGmailReply(account, replyData);
          break;
        case 'imap':
          await this.sendImapReply(account, replyData);
          break;
        default:
          throw new Error(`Unsupported email provider: ${account.provider}`);
      }

      console.log(`Auto-reply sent successfully for email ${pendingReply.email_id}`);

    } catch (error) {
      console.error(`Failed to send auto-reply for email ${pendingReply.email_id}:`, error);
      throw error;
    }
  }

  /**
   * Send reply via Outlook Graph API
   */
  private async sendOutlookReply(account: any, replyData: any): Promise<void> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: replyData.subject,
        body: {
          contentType: 'HTML',
          content: replyData.body
        },
        toRecipients: [{
          emailAddress: {
            address: replyData.to
          }
        }],
        ...(replyData.replyToMessageId && {
          conversationId: replyData.replyToMessageId
        })
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Outlook API error: ${error}`);
    }
  }

  /**
   * Send reply via Gmail API
   */
  private async sendGmailReply(account: any, replyData: any): Promise<void> {
    // Create RFC 2822 formatted message
    const message = [
      `To: ${replyData.to}`,
      `Subject: ${replyData.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      replyData.body
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gmail API error: ${error}`);
    }
  }

  /**
   * Send reply via IMAP/SMTP
   */
  private async sendImapReply(account: any, replyData: any): Promise<void> {
    // For IMAP accounts, we would typically use SMTP to send
    // This would require SMTP configuration for the account
    console.log('IMAP auto-reply sending not yet implemented - would use SMTP');
    
    // TODO: Implement SMTP sending for IMAP accounts
    // This would require:
    // 1. SMTP server configuration
    // 2. Authentication
    // 3. Message formatting and sending
    
    throw new Error('IMAP auto-reply sending not yet implemented');
  }

  /**
   * Get user's auto-reply settings
   */
  private async getUserAutoReplySettings(userId: string): Promise<AutoReplySettings> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('auto_reply_settings')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('Error fetching auto-reply settings:', error.message);
        // Return default settings if column doesn't exist or other error
        return this.getDefaultAutoReplySettings();
      }

      if (!data?.auto_reply_settings) {
        return this.getDefaultAutoReplySettings();
      }

      return data.auto_reply_settings;
    } catch (error) {
      console.warn('Exception fetching auto-reply settings:', error);
      return this.getDefaultAutoReplySettings();
    }
  }

  /**
   * Get default auto-reply settings
   */
  private getDefaultAutoReplySettings(): AutoReplySettings {
    return {
      enabled: false,
      delayMinutes: 5,
      enabledAgents: [],
      excludeUrgent: true,
      excludeDisputes: true,
      requireConfirmation: false,
      maxDailyReplies: 50
    };
  }

  /**
   * Get count of replies sent today
   */
  private async getTodayReplyCount(userEmail: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('pending_auto_replies')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', userEmail)
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString());

    if (error) {
      console.error('Failed to get today reply count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get pending replies for user
   */
  async getPendingReplies(userEmail: string): Promise<PendingReply[]> {
    const { data, error } = await supabase
      .from('pending_auto_replies')
      .select('*')
      .eq('user_email', userEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get pending replies:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Approve pending reply
   */
  async approvePendingReply(replyId: string): Promise<boolean> {
    try {
      // Update status to approved
      const { error } = await supabase
        .from('pending_auto_replies')
        .update({ status: 'approved' })
        .eq('id', replyId);

      if (error) {
        throw error;
      }

      // Get the reply to schedule it
      const { data: reply, error: fetchError } = await supabase
        .from('pending_auto_replies')
        .select('*')
        .eq('id', replyId)
        .single();

      if (fetchError || !reply) {
        throw new Error('Failed to fetch approved reply');
      }

      // Schedule for sending
      this.scheduleTimer(replyId, new Date(reply.scheduled_at));

      return true;
    } catch (error) {
      console.error(`Failed to approve reply ${replyId}:`, error);
      return false;
    }
  }

  /**
   * Cancel pending reply
   */
  async cancelPendingReply(replyId: string): Promise<boolean> {
    try {
      // Clear any scheduled timer
      const timer = this.timers.get(replyId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(replyId);
      }

      // Update status to cancelled
      const { error } = await supabase
        .from('pending_auto_replies')
        .update({ status: 'cancelled' })
        .eq('id', replyId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Failed to cancel reply ${replyId}:`, error);
      return false;
    }
  }

  /**
   * Initialize auto-reply service for user
   */
  async initializeForUser(userEmail: string): Promise<void> {
    try {
      // Get any existing approved replies that need scheduling
      const { data: approvedReplies, error } = await supabase
        .from('pending_auto_replies')
        .select('*')
        .eq('user_email', userEmail)
        .eq('status', 'approved')
        .gt('scheduled_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      // Schedule all approved replies
      approvedReplies?.forEach(reply => {
        this.scheduleTimer(reply.id, new Date(reply.scheduled_at));
      });

      console.log(`Initialized auto-reply service for ${userEmail} with ${approvedReplies?.length || 0} scheduled replies`);

    } catch (error) {
      console.error(`Failed to initialize auto-reply service for ${userEmail}:`, error);
    }
  }
}

export const autoReplyService = AutoReplyService.getInstance();
