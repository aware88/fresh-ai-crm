/**
 * Optimized Email Service
 * 
 * Hybrid proxy architecture for email management:
 * - Lightweight metadata in database (95% storage reduction)
 * - On-demand content loading from email server
 * - Smart caching for frequently accessed emails
 * - Zero impact on user experience
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { analyzeEmailForUpsell, EmailWithUpsell } from './enhanced-upsell-detection';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface EmailIndex {
  id: string;
  organization_id: string;
  user_id: string;
  email_account_id: string;
  message_id: string;
  thread_id?: string;
  imap_uid?: number;
  folder_name: string;
  sender_email: string;
  sender_name?: string;
  recipient_email?: string;
  subject?: string;
  preview_text?: string;
  email_type: 'received' | 'sent' | 'draft';
  importance: 'low' | 'normal' | 'high' | 'urgent';
  has_attachments: boolean;
  attachment_count: number;
  
  // AI Analysis
  ai_analyzed: boolean;
  ai_analyzed_at?: string;
  sentiment_score?: number;
  language_code?: string;
  upsell_data?: EmailWithUpsell;
  assigned_agent?: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  highlight_color?: string;
  agent_priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Status
  is_read: boolean;
  replied: boolean;
  last_reply_at?: string;
  processing_status: 'pending' | 'processed' | 'error';
  
  // Timestamps
  received_at: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

interface EmailContent {
  message_id: string;
  raw_content?: string;
  html_content?: string;
  plain_content?: string;
  attachments: any[];
  cached_at: string;
  last_accessed: string;
  access_count: number;
}

interface EmailWithContent extends EmailIndex {
  html_content?: string;
  plain_content?: string;
  raw_content?: string;
  attachments?: any[];
  content_cached: boolean;
  content_last_accessed?: string;
  opportunity_value: number;
  email_status: 'replied' | 'unread' | 'urgent' | 'assigned' | 'normal';
}

interface EmailLoadOptions {
  folder?: string;
  limit?: number;
  offset?: number;
  includeContent?: boolean;
  forceRefresh?: boolean;
}

// =====================================================
// OPTIMIZED EMAIL SERVICE CLASS
// =====================================================

export class OptimizedEmailService {
  private supabase = createClientComponentClient<Database>();
  private contentCache = new Map<string, EmailContent>();
  private loadingPromises = new Map<string, Promise<EmailContent | null>>();

  // =====================================================
  // CORE EMAIL LOADING
  // =====================================================

  /**
   * Load emails with smart caching
   * Returns metadata immediately, loads content on-demand
   */
  async loadEmails(
    emailAccountId: string,
    options: EmailLoadOptions = {}
  ): Promise<EmailWithContent[]> {
    const {
      folder = 'INBOX',
      limit = 50,
      offset = 0,
      includeContent = false,
      forceRefresh = false
    } = options;

    try {
      // 1. Load email metadata (fast - no content)
      const { data: emails, error } = await this.supabase
        .rpc('get_emails_with_content', {
          p_email_account_id: emailAccountId,
          p_folder: folder,
          p_limit: limit,
          p_offset: offset
        });

      if (error) {
        console.error('Error loading emails:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        throw new Error(`Failed to load emails: ${error.message || 'Unknown database error'}`);
      }

      if (!emails) return [];

      // 2. If content requested, load it on-demand
      if (includeContent) {
        await this.preloadEmailContent(
          emails.map(e => e.message_id),
          forceRefresh
        );
      }

      return emails.map(email => ({
        ...email,
        opportunity_value: this.calculateOpportunityValue(email.upsell_data),
        email_status: this.determineEmailStatus(email)
      }));

    } catch (error) {
      console.error('Failed to load emails:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      throw error instanceof Error ? error : new Error('Failed to load emails');
    }
  }

  /**
   * Get single email with full content
   */
  async getEmailWithContent(
    messageId: string,
    forceRefresh = false
  ): Promise<EmailWithContent | null> {
    try {
      // 1. Get email metadata
      const { data: emailData, error } = await this.supabase
        .from('email_index')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error || !emailData) {
        console.error('Email not found:', messageId);
        return null;
      }

      // 2. Get or load content
      const content = await this.getEmailContent(messageId, forceRefresh);

      return {
        ...emailData,
        html_content: content?.html_content,
        plain_content: content?.plain_content,
        raw_content: content?.raw_content,
        attachments: content?.attachments || [],
        content_cached: !!content,
        content_last_accessed: content?.last_accessed,
        opportunity_value: this.calculateOpportunityValue(emailData.upsell_data),
        email_status: this.determineEmailStatus(emailData)
      };

    } catch (error) {
      console.error('Failed to get email with content:', error);
      return null;
    }
  }

  // =====================================================
  // ON-DEMAND CONTENT LOADING
  // =====================================================

  /**
   * Get email content with smart caching
   */
  async getEmailContent(
    messageId: string,
    forceRefresh = false
  ): Promise<EmailContent | null> {
    // Check local cache first
    if (!forceRefresh && this.contentCache.has(messageId)) {
      const cached = this.contentCache.get(messageId)!;
      // Update access stats
      this.updateContentAccess(messageId);
      return cached;
    }

    // Check if already loading
    if (this.loadingPromises.has(messageId)) {
      return await this.loadingPromises.get(messageId)!;
    }

    // Load content
    const loadPromise = this.loadEmailContentFromSource(messageId, forceRefresh);
    this.loadingPromises.set(messageId, loadPromise);

    try {
      const content = await loadPromise;
      this.loadingPromises.delete(messageId);
      
      if (content) {
        this.contentCache.set(messageId, content);
      }
      
      return content;
    } catch (error) {
      this.loadingPromises.delete(messageId);
      throw error;
    }
  }

  /**
   * Load content from database cache or email server
   */
  private async loadEmailContentFromSource(
    messageId: string,
    forceRefresh = false
  ): Promise<EmailContent | null> {
    try {
      // 1. Try database cache first (if not forcing refresh)
      if (!forceRefresh) {
        const { data: cached, error } = await this.supabase
          .from('email_content_cache')
          .select('*')
          .eq('message_id', messageId)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (cached && !error) {
          console.log(`📧 Content cache hit for ${messageId}`);
          return cached;
        }
      }

      // 2. Load from email server (IMAP/API)
      console.log(`📧 Loading content from email server for ${messageId}`);
      const content = await this.fetchEmailContentFromServer(messageId);

      if (content) {
        // 3. Cache the content
        await this.cacheEmailContent(content);
        return content;
      }

      return null;

    } catch (error) {
      console.error('Failed to load email content:', error);
      return null;
    }
  }

  /**
   * Fetch email content from email server (IMAP/Exchange/Gmail API)
   */
  private async fetchEmailContentFromServer(messageId: string): Promise<EmailContent | null> {
    try {
      // Get email metadata to determine server details
      const { data: emailMeta, error } = await this.supabase
        .from('email_index')
        .select(`
          *,
          email_accounts!inner(
            email_address,
            imap_host,
            imap_port,
            imap_username,
            imap_password_encrypted,
            provider_type
          )
        `)
        .eq('message_id', messageId)
        .single();

      if (error || !emailMeta) {
        throw new Error(`Email metadata not found for ${messageId}`);
      }

      // Based on provider type, use appropriate fetching method
      const account = emailMeta.email_accounts;
      
      if (account.provider_type === 'gmail') {
        return await this.fetchFromGmailAPI(messageId, account);
      } else if (account.provider_type === 'outlook') {
        return await this.fetchFromOutlookAPI(messageId, account);
      } else {
        return await this.fetchFromIMAP(messageId, emailMeta, account);
      }

    } catch (error) {
      console.error('Failed to fetch from email server:', error);
      return null;
    }
  }

  /**
   * Fetch from Gmail API
   */
  private async fetchFromGmailAPI(messageId: string, account: any): Promise<EmailContent | null> {
    // Implementation for Gmail API
    // This would use the Gmail API to fetch the full message
    console.log('🔄 Fetching from Gmail API...');
    
    // TODO: Implement Gmail API integration
    // For now, return placeholder
    return {
      message_id: messageId,
      html_content: '<p>Content loaded from Gmail API</p>',
      plain_content: 'Content loaded from Gmail API',
      attachments: [],
      cached_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      access_count: 1
    };
  }

  /**
   * Fetch from Outlook API
   */
  private async fetchFromOutlookAPI(messageId: string, account: any): Promise<EmailContent | null> {
    // Implementation for Outlook/Exchange API
    console.log('🔄 Fetching from Outlook API...');
    
    // TODO: Implement Outlook API integration
    return {
      message_id: messageId,
      html_content: '<p>Content loaded from Outlook API</p>',
      plain_content: 'Content loaded from Outlook API',
      attachments: [],
      cached_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      access_count: 1
    };
  }

  /**
   * Fetch from IMAP server
   */
  private async fetchFromIMAP(
    messageId: string,
    emailMeta: any,
    account: any
  ): Promise<EmailContent | null> {
    console.log('🔄 Fetching from IMAP server...');
    
    try {
      // Use existing IMAP client logic
      // This would connect to IMAP and fetch the specific message
      const response = await fetch('/api/emails/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          imapUid: emailMeta.imap_uid,
          folder: emailMeta.folder_name,
          accountId: emailMeta.email_account_id
        })
      });

      if (!response.ok) {
        throw new Error(`IMAP fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        message_id: messageId,
        raw_content: data.raw,
        html_content: data.html,
        plain_content: data.text,
        attachments: data.attachments || [],
        cached_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        access_count: 1
      };

    } catch (error) {
      console.error('IMAP fetch error:', error);
      return null;
    }
  }

  // =====================================================
  // CONTENT CACHING
  // =====================================================

  /**
   * Cache email content in database
   */
  private async cacheEmailContent(content: EmailContent): Promise<void> {
    try {
      await this.supabase.rpc('cache_email_content', {
        p_message_id: content.message_id,
        p_raw_content: content.raw_content,
        p_html_content: content.html_content,
        p_plain_content: content.plain_content,
        p_attachments: content.attachments
      });

      console.log(`✅ Cached content for ${content.message_id}`);
    } catch (error) {
      console.error('Failed to cache email content:', error);
    }
  }

  /**
   * Update content access statistics
   */
  private async updateContentAccess(messageId: string): Promise<void> {
    try {
      await this.supabase
        .from('email_content_cache')
        .update({
          last_accessed: new Date().toISOString(),
          access_count: this.supabase.rpc('increment', { field: 'access_count' })
        })
        .eq('message_id', messageId);
    } catch (error) {
      console.error('Failed to update access stats:', error);
    }
  }

  /**
   * Preload content for multiple emails
   */
  private async preloadEmailContent(
    messageIds: string[],
    forceRefresh = false
  ): Promise<void> {
    const loadPromises = messageIds.map(id => 
      this.getEmailContent(id, forceRefresh)
    );

    try {
      await Promise.allSettled(loadPromises);
      console.log(`📧 Preloaded content for ${messageIds.length} emails`);
    } catch (error) {
      console.error('Failed to preload email content:', error);
    }
  }

  // =====================================================
  // AI ANALYSIS & CRM FEATURES
  // =====================================================

  /**
   * Analyze email for upselling opportunities
   */
  async analyzeEmailForUpsell(messageId: string): Promise<boolean> {
    try {
      // Get email content
      const content = await this.getEmailContent(messageId);
      if (!content?.html_content && !content?.plain_content) {
        console.warn('No content available for analysis:', messageId);
        return false;
      }

      // Get email metadata
      const { data: email, error } = await this.supabase
        .from('email_index')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error || !email) {
        throw new Error('Email not found for analysis');
      }

      // Skip if already analyzed
      if (email.ai_analyzed) {
        console.log('Email already analyzed:', messageId);
        return true;
      }

      // Perform AI analysis
      const emailForAnalysis = {
        id: email.id,
        from_address: email.sender_email,
        subject: email.subject || '',
        text_content: content.plain_content || '',
        html_content: content.html_content || '',
        received_date: email.received_at
      };

      const analysis = await analyzeEmailForUpsell(emailForAnalysis);

      // Store analysis results
      const { error: updateError } = await this.supabase.rpc(
        'update_email_analysis_optimized',
        {
          p_message_id: messageId,
          p_upsell_data: analysis.upsellData,
          p_assigned_agent: analysis.assignedAgent,
          p_highlight_color: analysis.highlightColor,
          p_agent_priority: analysis.agentPriority,
          p_sentiment_score: analysis.sentimentScore,
          p_language_code: analysis.languageCode
        }
      );

      if (updateError) {
        throw updateError;
      }

      console.log(`🤖 AI analysis completed for ${messageId}`);
      return true;

    } catch (error) {
      console.error('Failed to analyze email:', error);
      return false;
    }
  }

  /**
   * Mark email as replied
   */
  async markEmailReplied(messageId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc(
        'mark_email_replied_optimized',
        { p_message_id: messageId }
      );

      if (error) throw error;

      console.log(`✅ Marked email as replied: ${messageId}`);
      return data;
    } catch (error) {
      console.error('Failed to mark email as replied:', error);
      return false;
    }
  }

  /**
   * Get unanalyzed emails for background processing
   */
  async getUnanalyzedEmails(
    organizationId: string,
    limit = 10
  ): Promise<EmailIndex[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_unanalyzed_emails_optimized',
        {
          p_organization_id: organizationId,
          p_limit: limit
        }
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get unanalyzed emails:', error);
      return [];
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private calculateOpportunityValue(upsellData: any): number {
    if (!upsellData?.hasUpsellOpportunity) return 0;
    return parseFloat(upsellData.totalPotentialValue) || 0;
  }

  private determineEmailStatus(email: any): string {
    if (email.replied) return 'replied';
    if (!email.is_read) return 'unread';
    if (email.agent_priority === 'urgent') return 'urgent';
    if (email.assigned_agent) return 'assigned';
    return 'normal';
  }

  /**
   * Search emails across metadata and content
   */
  async searchEmails(
    organizationId: string,
    query: string,
    options: EmailLoadOptions = {}
  ): Promise<EmailWithContent[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_index')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`subject.ilike.%${query}%,sender_email.ilike.%${query}%,preview_text.ilike.%${query}%`)
        .order('received_at', { ascending: false })
        .limit(options.limit || 50);

      if (error) throw error;

      return (data || []).map(email => ({
        ...email,
        content_cached: false,
        opportunity_value: this.calculateOpportunityValue(email.upsell_data),
        email_status: this.determineEmailStatus(email)
      }));

    } catch (error) {
      console.error('Failed to search emails:', error);
      return [];
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('email_index')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const emails = data || [];
      
      return {
        total_emails: emails.length,
        analyzed_emails: emails.filter(e => e.ai_analyzed).length,
        unread_emails: emails.filter(e => !e.is_read).length,
        high_priority_emails: emails.filter(e => 
          e.agent_priority === 'high' || e.agent_priority === 'urgent'
        ).length,
        opportunities_count: emails.filter(e => 
          e.upsell_data?.hasUpsellOpportunity
        ).length,
        cached_emails: await this.getCachedEmailCount(),
        storage_saved_mb: await this.getStorageSavedEstimate(organizationId)
      };
    } catch (error) {
      console.error('Failed to get email stats:', error);
      return null;
    }
  }

  private async getCachedEmailCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('email_content_cache')
        .select('*', { count: 'exact', head: true });

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getStorageSavedEstimate(organizationId: string): Promise<number> {
    // Estimate storage saved by not storing full content
    // Average email content: ~100KB, metadata only: ~5KB = 95% savings
    try {
      const { count } = await this.supabase
        .from('email_index')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      const emailCount = count || 0;
      const averageContentSize = 100 * 1024; // 100KB per email
      const averageMetadataSize = 5 * 1024; // 5KB per email
      const savedBytes = emailCount * (averageContentSize - averageMetadataSize);
      
      return Math.round(savedBytes / (1024 * 1024)); // Convert to MB
    } catch (error) {
      return 0;
    }
  }
}

// Export singleton instance
export const optimizedEmailService = new OptimizedEmailService();
