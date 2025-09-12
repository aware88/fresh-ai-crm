/**
 * Real-time Email Sync Manager
 * 
 * Orchestrates live email synchronization across all providers:
 * - Microsoft Graph: Webhooks + Delta sync
 * - Gmail: Push notifications + Delta sync  
 * - IMAP: Intelligent polling
 * 
 * Automatically triggers AI analysis, draft preparation, and caching
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { WebhookService } from './webhook-service';
import { getBackgroundProcessor } from './background-ai-processor';
import { optimizedEmailService } from './optimized-email-service';

export interface SyncConfig {
  provider: 'microsoft' | 'google' | 'imap';
  accountId: string;
  userId: string;
  email: string;
  enableWebhooks: boolean;
  pollingInterval: number; // minutes
  enableAI: boolean;
  enableDraftPreparation: boolean;
}

export class RealTimeSyncManager {
  private static instance: RealTimeSyncManager;
  private activeSyncs: Map<string, NodeJS.Timeout> = new Map();
  private webhookService: WebhookService;
  private backgroundProcessor: any;

  private constructor() {
    this.webhookService = WebhookService.getInstance();
    this.backgroundProcessor = getBackgroundProcessor();
  }

  public static getInstance(): RealTimeSyncManager {
    if (!RealTimeSyncManager.instance) {
      RealTimeSyncManager.instance = new RealTimeSyncManager();
    }
    return RealTimeSyncManager.instance;
  }

  /**
   * Start real-time sync for an email account
   */
  async startRealTimeSync(config: SyncConfig): Promise<void> {
    console.log(`🚀 Starting real-time sync for ${config.email} (${config.provider})`);

    try {
      // 1. Register webhooks for supported providers
      if (config.enableWebhooks && (config.provider === 'microsoft' || config.provider === 'google')) {
        await this.setupWebhooks(config);
      }

      // 2. Start intelligent polling as fallback/primary for IMAP
      await this.setupPolling(config);

      // 3. Perform initial sync to catch up
      await this.performInitialSync(config);

      // 4. Mark account as live-synced
      await this.updateAccountSyncStatus(config.accountId, true);

      console.log(`✅ Real-time sync active for ${config.email}`);

    } catch (error) {
      console.error(`❌ Failed to start real-time sync for ${config.email}:`, error);
      throw error;
    }
  }

  /**
   * Stop real-time sync for an account
   */
  async stopRealTimeSync(accountId: string): Promise<void> {
    console.log(`🛑 Stopping real-time sync for account ${accountId}`);

    // Clear polling timer
    const timer = this.activeSyncs.get(accountId);
    if (timer) {
      clearInterval(timer);
      this.activeSyncs.delete(accountId);
    }

    // Update account status
    await this.updateAccountSyncStatus(accountId, false);

    console.log(`✅ Real-time sync stopped for account ${accountId}`);
  }

  /**
   * Setup webhooks for Microsoft/Google
   */
  private async setupWebhooks(config: SyncConfig): Promise<void> {
    try {
      const webhookId = await this.webhookService.registerWebhook(
        config.provider === 'microsoft' ? 'outlook' : 'gmail',
        config.accountId
      );

      console.log(`📞 Webhook registered for ${config.email}: ${webhookId}`);

      // Store webhook ID in database
      const supabase = createServiceRoleClient();
      await supabase
        .from('email_accounts')
        .update({
          webhook_id: webhookId,
          webhook_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.accountId);

    } catch (error) {
      console.warn(`⚠️ Webhook setup failed for ${config.email}, falling back to polling:`, error);
    }
  }

  /**
   * Setup intelligent polling
   */
  private async setupPolling(config: SyncConfig): Promise<void> {
    // Clear existing timer
    const existingTimer = this.activeSyncs.get(config.accountId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Determine polling frequency based on provider and activity
    const intervalMs = this.calculatePollingInterval(config);

    // Start polling
    const timer = setInterval(async () => {
      await this.performIncrementalSync(config);
    }, intervalMs);

    this.activeSyncs.set(config.accountId, timer);

    console.log(`⏰ Polling started for ${config.email} every ${config.pollingInterval} minutes`);
  }

  /**
   * Perform initial sync to catch up
   */
  private async performInitialSync(config: SyncConfig): Promise<void> {
    console.log(`🔄 Performing initial sync for ${config.email}...`);

    try {
      let syncResult;

      switch (config.provider) {
        case 'microsoft':
          syncResult = await this.syncMicrosoft(config.accountId, { maxEmails: 200, delta: false });
          break;
        case 'google':
          syncResult = await this.syncGmail(config.accountId, { maxEmails: 200, delta: false });
          break;
        case 'imap':
          syncResult = await this.syncIMAP(config.accountId, { maxEmails: 200 });
          break;
      }

      console.log(`✅ Initial sync complete for ${config.email}: ${syncResult?.emailsProcessed || 0} emails`);

      // Trigger AI processing for new emails
      if (config.enableAI && syncResult?.newEmails?.length > 0) {
        await this.backgroundProcessor.processEmailsWithAI(syncResult.newEmails);
      }

    } catch (error) {
      console.error(`❌ Initial sync failed for ${config.email}:`, error);
    }
  }

  /**
   * Perform incremental sync (delta/polling)
   */
  private async performIncrementalSync(config: SyncConfig): Promise<void> {
    try {
      let syncResult;

      switch (config.provider) {
        case 'microsoft':
          // Use delta sync for Microsoft Graph
          syncResult = await this.syncMicrosoft(config.accountId, { delta: true, maxEmails: 50 });
          break;
        case 'google':
          // Use push notifications + delta for Gmail
          syncResult = await this.syncGmail(config.accountId, { delta: true, maxEmails: 50 });
          break;
        case 'imap':
          // Use IDLE or polling for IMAP
          syncResult = await this.syncIMAP(config.accountId, { maxEmails: 50, onlyNew: true });
          break;
      }

      if (syncResult?.newEmails?.length > 0) {
        console.log(`📧 Found ${syncResult.newEmails.length} new emails for ${config.email}`);

        // Trigger AI processing pipeline
        if (config.enableAI) {
          await this.backgroundProcessor.processEmailsWithAI(syncResult.newEmails);
        }

        // Notify UI of new emails (WebSocket/SSE could be added here)
        await this.notifyNewEmails(config.userId, syncResult.newEmails);
      }

    } catch (error) {
      console.error(`❌ Incremental sync failed for ${config.email}:`, error);
    }
  }

  /**
   * Sync Microsoft Graph emails
   */
  private async syncMicrosoft(accountId: string, options: { delta?: boolean; maxEmails?: number }) {
    try {
      const port = process.env.PORT || '3000';
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:${port}`
        : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000');
      
      // Use internal API with service role auth for server-side sync
      const response = await fetch(`${baseUrl}/api/emails/graph/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Internal-RealTime-Sync',
          // Add internal auth if available
          ...(process.env.INTERNAL_API_KEY && {
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
          })
        },
        body: JSON.stringify({
          accountId,
          folder: 'inbox',
          maxEmails: options.maxEmails || 50,
          delta: options.delta !== false,
          internalCall: true // Flag for internal processing
        })
      });

      if (!response.ok) {
        console.warn(`Graph sync failed: ${response.status} ${response.statusText}`);
        return { success: false, error: `HTTP ${response.status}` };
      }

      return await response.json();
    } catch (error) {
      console.warn('Microsoft sync error (non-critical):', error);
      return { success: false, error: error?.toString() || 'Unknown error' };
    }
  }

  /**
   * Sync Gmail emails
   */
  private async syncGmail(accountId: string, options: { delta?: boolean; maxEmails?: number }) {
    const port = process.env.PORT || '3000';
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:${port}`
      : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/emails/gmail/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        folder: 'inbox',
        maxEmails: options.maxEmails || 50,
        delta: options.delta !== false
      })
    });

    return await response.json();
  }

  /**
   * Sync IMAP emails
   */
  private async syncIMAP(accountId: string, options: { maxEmails?: number; onlyNew?: boolean }) {
    const port = process.env.PORT || '3000';
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:${port}`
      : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/email/sync-to-database`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync'
      },
      body: JSON.stringify({
        accountId,
        maxEmails: options.maxEmails || 50,
        onlyNew: options.onlyNew || false
      })
    });

    return await response.json();
  }

  /**
   * Calculate optimal polling interval based on provider and webhooks
   */
  private calculatePollingInterval(config: SyncConfig): number {
    const baseInterval = config.pollingInterval * 60 * 1000; // Convert minutes to ms

    // If webhooks are enabled, use minimal polling as backup
    if (config.enableWebhooks && (config.provider === 'microsoft' || config.provider === 'google')) {
      switch (config.provider) {
        case 'microsoft':
          // With webhooks: minimal backup polling (30 seconds)
          return Math.max(30 * 1000, Math.min(baseInterval, 2 * 60 * 1000));
        case 'google':
          // With webhooks: minimal backup polling (30 seconds)  
          return Math.max(30 * 1000, Math.min(baseInterval, 2 * 60 * 1000));
      }
    }

    // Without webhooks: rely on frequent polling
    switch (config.provider) {
      case 'microsoft':
        return Math.max(baseInterval, 1 * 60 * 1000); // Min 1 minute without webhooks
      case 'google':
        return Math.max(baseInterval, 1 * 60 * 1000); // Min 1 minute without webhooks
      case 'imap':
        // IMAP always relies on polling
        return Math.max(baseInterval, 30 * 1000); // Min 30 seconds for IMAP
      default:
        return baseInterval;
    }
  }

  /**
   * Update account sync status in database
   */
  private async updateAccountSyncStatus(accountId: string, isActive: boolean): Promise<void> {
    const supabase = createServiceRoleClient();
    await supabase
      .from('email_accounts')
      .update({
        real_time_sync_active: isActive,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);
  }

  /**
   * Notify UI of new emails (could be WebSocket/SSE)
   */
  private async notifyNewEmails(userId: string, newEmails: any[]): Promise<void> {
    // For now, just log - could implement WebSocket notifications later
    console.log(`📬 Notifying user ${userId} of ${newEmails.length} new emails`);
    
    // Could trigger browser notification or update real-time UI here
    // await this.sendPushNotification(userId, `${newEmails.length} new emails`);
  }

  /**
   * Start real-time sync for all active accounts
   */
  async startAllActiveSyncs(): Promise<void> {
    console.log('🚀 Starting real-time sync for all active accounts...');

    const supabase = createServiceRoleClient();
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('id, user_id, email, provider_type, is_active')
      .eq('is_active', true);

    if (error || !accounts) {
      console.error('Failed to fetch active email accounts:', error);
      return;
    }

    for (const account of accounts) {
      const config: SyncConfig = {
        provider: account.provider_type as 'microsoft' | 'google' | 'imap',
        accountId: account.id,
        userId: account.user_id,
        email: account.email,
        enableWebhooks: true,
        pollingInterval: this.getDefaultPollingInterval(account.provider_type),
        enableAI: true,
        enableDraftPreparation: true
      };

      try {
        await this.startRealTimeSync(config);
      } catch (error) {
        console.error(`Failed to start sync for ${account.email}:`, error);
      }
    }

    console.log(`✅ Real-time sync started for ${accounts.length} accounts`);
  }

  /**
   * Get default polling interval based on provider (in minutes)
   */
  private getDefaultPollingInterval(providerType: string): number {
    switch (providerType) {
      case 'microsoft':
      case 'outlook':
        return 0.5; // 30 seconds for Microsoft (with webhook backup)
      case 'google':
      case 'gmail':
        return 0.5; // 30 seconds for Gmail (with webhook backup)
      case 'imap':
        return 0.5; // 30 seconds for IMAP (polling only)
      default:
        return 1; // 1 minute default
    }
  }
}

// Export singleton instance
export const realTimeSyncManager = RealTimeSyncManager.getInstance();


