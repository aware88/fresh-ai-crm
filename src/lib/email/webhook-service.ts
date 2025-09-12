import { createClient } from '@supabase/supabase-js';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WebhookConfig {
  id: string;
  provider: 'outlook' | 'imap' | 'gmail';
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export class WebhookService {
  private static instance: WebhookService;
  
  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  /**
   * Register webhook with email provider
   */
  async registerWebhook(provider: 'outlook' | 'imap' | 'gmail', accountId: string): Promise<string> {
    // Use multiple fallbacks for webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';
    
    const webhookUrl = `${baseUrl}/api/webhooks/email-received`;
    
    console.log(`📞 Attempting to register webhook: ${webhookUrl}`);
    
    // Skip webhooks in development (localhost) as they won't work
    if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
      console.log('⚠️  Skipping webhook registration in development (localhost URLs not supported)');
      return 'dev-polling-fallback';
    }
    
    try {
      switch (provider) {
        case 'outlook':
          return await this.registerOutlookWebhook(accountId, webhookUrl);
        case 'gmail':
          return await this.registerGmailWebhook(accountId, webhookUrl);
        case 'imap':
          // IMAP doesn't support webhooks, use polling fallback
          console.log('IMAP does not support webhooks, using polling fallback');
          return 'imap-polling';
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to register webhook for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Register Outlook webhook using Microsoft Graph API
   */
  private async registerOutlookWebhook(accountId: string, webhookUrl: string): Promise<string> {
    // Get user_id for the account first
    const { data: account } = await supabase
      .from('email_accounts')
      .select('user_id')
      .eq('id', accountId)
      .single();

    if (!account?.user_id) {
      throw new Error('No user found for account');
    }

    // Get valid access token (will refresh if needed)
    const tokenResult = await getValidMicrosoftAccessToken({
      userId: account.user_id,
      accountId: accountId
    });

    if (!tokenResult) {
      throw new Error('Failed to get valid access token for account');
    }

    const subscription = {
      changeType: 'created',
      notificationUrl: webhookUrl,
      resource: '/me/messages',
      expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(), // ~3 days
      clientState: accountId // Use account ID as client state for verification
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Outlook subscription: ${error}`);
    }

    const result = await response.json();
    
    // Store webhook config
    await this.saveWebhookConfig({
      id: result.id,
      provider: 'outlook',
      webhookUrl,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    return result.id;
  }

  /**
   * Register Gmail webhook using Gmail Push API
   */
  private async registerGmailWebhook(accountId: string, webhookUrl: string): Promise<string> {
    // Get account details including user_id to fetch fresh tokens
    const { data: account } = await supabase
      .from('email_accounts')
      .select('user_id, access_token, refresh_token')
      .eq('id', accountId)
      .single();

    if (!account?.access_token) {
      console.warn('⚠️  No access token found for Gmail account, skipping webhook registration');
      return 'no-token-polling-fallback';
    }

    const watchRequest = {
      topicName: process.env.GMAIL_PUBSUB_TOPIC,
      labelIds: ['INBOX'],
      labelFilterAction: 'include'
    };

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(watchRequest)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Gmail watch: ${error}`);
    }

    const result = await response.json();
    
    // Store webhook config
    await this.saveWebhookConfig({
      id: result.historyId,
      provider: 'gmail',
      webhookUrl,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    return result.historyId;
  }

  /**
   * Save webhook configuration to database
   */
  private async saveWebhookConfig(config: WebhookConfig): Promise<void> {
    const { error } = await supabase
      .from('webhook_configs')
      .upsert(config);

    if (error) {
      console.error('Failed to save webhook config:', error);
    }
  }

  /**
   * Get active webhooks
   */
  async getActiveWebhooks(): Promise<WebhookConfig[]> {
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('isActive', true);

    if (error) {
      console.error('Failed to get webhooks:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Deactivate webhook
   */
  async deactivateWebhook(webhookId: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_configs')
      .update({ isActive: false })
      .eq('id', webhookId);

    if (error) {
      console.error('Failed to deactivate webhook:', error);
    }
  }

  /**
   * Auto-setup webhooks for all active email accounts
   */
  async setupWebhooksForAllAccounts(): Promise<void> {
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('id, provider, email')
      .eq('is_active', true);

    if (!accounts) return;

    console.log(`Setting up webhooks for ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        await this.registerWebhook(account.provider as any, account.id);
        console.log(`✅ Webhook registered for ${account.email}`);
      } catch (error) {
        console.error(`❌ Failed to register webhook for ${account.email}:`, error);
      }
    }
  }
}

export const webhookService = WebhookService.getInstance();




