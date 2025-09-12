import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { realTimeSyncManager } from '@/lib/email/real-time-sync-manager';
import { getBackgroundProcessor } from '@/lib/email/background-ai-processor';
import { EmailLearningService } from '@/lib/email/email-learning-service';

/**
 * Automatic Email Sync Cron Job
 * 
 * This runs periodically to ensure all email accounts are synced
 * and new emails are processed through AI learning pipeline.
 * 
 * Can be triggered by:
 * - Vercel Cron (production)
 * - Manual call (development)
 * - External scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret only if it's set (optional for non-Vercel deployments)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.CRON_SECRET_KEY;
    
    // Only enforce auth if a secret is configured
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        // Allow local/test access without auth
        const { hostname } = new URL(request.url);
        if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }

    console.log('🔄 Starting automatic email sync for all accounts...');
    
    const supabase = createServiceRoleClient();
    const backgroundProcessor = getBackgroundProcessor();
    const learningService = new EmailLearningService();
    
    // Get all active email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_active', true);
    
    if (accountsError || !accounts) {
      console.error('Failed to fetch email accounts:', accountsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch email accounts'
      }, { status: 500 });
    }
    
    console.log(`Found ${accounts.length} active email accounts to sync`);
    
    const results = {
      total_accounts: accounts.length,
      synced: 0,
      failed: 0,
      new_emails_total: 0,
      details: [] as any[]
    };
    
    // Process each account
    for (const account of accounts) {
      try {
        console.log(`\n📧 Syncing ${account.email} (${account.provider_type})...`);
        
        // Determine sync method based on provider
        let syncResult: any = null;
        
        // Configure base URL for all sync endpoints
        const port = process.env.PORT || '3000';
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? `http://localhost:${port}`
          : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
        
        if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
          // Use Graph API sync
          const response = await fetch(`${baseUrl}/api/emails/graph/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId: account.id,
              folder: 'inbox',
              maxEmails: 200,
              delta: true // Use delta sync for incremental updates
            })
          });
          
          if (response.ok) {
            syncResult = await response.json();
          }
        } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
          // Use Gmail API sync
          const response = await fetch(`${baseUrl}/api/emails/gmail/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId: account.id,
              folder: 'inbox',
              maxEmails: 200,
              delta: true
            })
          });
          
          if (response.ok) {
            syncResult = await response.json();
          }
        } else if (account.provider_type === 'imap') {
          // Use IMAP sync
          const response = await fetch(`${baseUrl}/api/email/sync-to-database`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId: account.id,
              maxEmails: 200,
              onlyNew: true // Only fetch new emails since last sync
            })
          });
          
          if (response.ok) {
            syncResult = await response.json();
          }
        }
        
        if (syncResult?.success || syncResult?.totalSaved > 0) {
          const emailsSynced = syncResult.totalSaved || syncResult.importCount || 0;
          console.log(`✅ Synced ${emailsSynced} emails for ${account.email}`);
          
          // Get newly synced emails for AI processing
          const { data: newEmails } = await supabase
            .from('email_index')
            .select('*')
            .eq('email_account_id', account.id)
            .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
            .order('received_at', { ascending: false })
            .limit(50);
          
          if (newEmails && newEmails.length > 0) {
            console.log(`🤖 Processing ${newEmails.length} new emails through AI...`);
            
            // Process emails through AI in background
            try {
              await backgroundProcessor.processEmailsWithAI(newEmails);
              
              // Also trigger learning for better patterns
              if (newEmails.length >= 5) {
                await learningService.performIncrementalLearning(
                  account.user_id,
                  undefined,
                  account.id
                );
              }
            } catch (aiError) {
              console.error(`AI processing failed for ${account.email}:`, aiError);
            }
          }
          
          // Update last sync timestamp
          await supabase
            .from('email_accounts')
            .update({
              last_sync_at: new Date().toISOString(),
              sync_error: null
            })
            .eq('id', account.id);
          
          results.synced++;
          results.new_emails_total += emailsSynced;
          results.details.push({
            account: account.email,
            status: 'success',
            emails_synced: emailsSynced,
            ai_processed: newEmails?.length || 0
          });
          
        } else {
          throw new Error(syncResult?.error || 'Sync returned no results');
        }
        
      } catch (error) {
        console.error(`❌ Failed to sync ${account.email}:`, error);
        
        // Update account with error
        await supabase
          .from('email_accounts')
          .update({
            sync_error: error instanceof Error ? error.message : 'Unknown sync error',
            last_sync_attempt_at: new Date().toISOString()
          })
          .eq('id', account.id);
        
        results.failed++;
        results.details.push({
          account: account.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Start real-time sync for any accounts that need it
    try {
      console.log('\n🚀 Ensuring real-time sync is active...');
      await realTimeSyncManager.startAllActiveSyncs();
    } catch (rtError) {
      console.error('Real-time sync initialization failed:', rtError);
    }
    
    console.log('\n📊 Auto-sync complete:', {
      accounts: results.total_accounts,
      synced: results.synced,
      failed: results.failed,
      new_emails: results.new_emails_total
    });
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auto-sync cron job failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}