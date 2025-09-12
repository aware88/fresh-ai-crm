import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { realTimeSyncManager } from '@/lib/email/real-time-sync-manager';

/**
 * Ensures email sync is active for an account
 * This is called automatically when users access their email
 * 
 * POST /api/email/ensure-sync-active
 */
export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      // If no specific account, ensure ALL accounts are syncing
      const supabase = createServiceRoleClient();
      
      // Get all active accounts that don't have real-time sync
      const { data: accounts } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('is_active', true)
        .eq('real_time_sync_active', false);
      
      if (accounts && accounts.length > 0) {
        console.log(`🔧 Enabling real-time sync for ${accounts.length} accounts...`);
        
        for (const account of accounts) {
          // Enable real-time sync
          await supabase
            .from('email_accounts')
            .update({
              real_time_sync_active: true,
              setup_completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);
          
          // Start real-time sync
          try {
            await realTimeSyncManager.startRealTimeSync({
              provider: account.provider_type as 'microsoft' | 'google' | 'imap',
              accountId: account.id,
              userId: account.user_id,
              email: account.email,
              enableWebhooks: account.provider_type !== 'imap',
              pollingInterval: account.provider_type === 'imap' ? 2 : 5,
              enableAI: true,
              enableDraftPreparation: true
            });
            
            console.log(`✅ Real-time sync started for ${account.email}`);
          } catch (err) {
            console.error(`Failed to start sync for ${account.email}:`, err);
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Real-time sync ensured for all accounts',
        accountsFixed: accounts?.length || 0
      });
    }
    
    // For specific account
    const supabase = createServiceRoleClient();
    
    const { data: account } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Check if real-time sync is active
    if (!account.real_time_sync_active) {
      console.log(`🔧 Enabling real-time sync for ${account.email}...`);
      
      // Enable it
      await supabase
        .from('email_accounts')
        .update({
          real_time_sync_active: true,
          setup_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
      
      // Start real-time sync
      await realTimeSyncManager.startRealTimeSync({
        provider: account.provider_type as 'microsoft' | 'google' | 'imap',
        accountId: account.id,
        userId: account.user_id,
        email: account.email,
        enableWebhooks: account.provider_type !== 'imap',
        pollingInterval: account.provider_type === 'imap' ? 2 : 5,
        enableAI: true,
        enableDraftPreparation: true
      });
      
      console.log(`✅ Real-time sync activated for ${account.email}`);
    }
    
    // Also trigger immediate sync if needed
    const lastSync = account.last_sync_at ? new Date(account.last_sync_at).getTime() : 0;
    const minutesSinceSync = (Date.now() - lastSync) / (1000 * 60);
    
    if (minutesSinceSync > 5) {
      console.log(`📧 Triggering sync for ${account.email} (last sync was ${Math.round(minutesSinceSync)} minutes ago)`);
      
      // Trigger sync based on provider
      let syncEndpoint = '';
      if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
        syncEndpoint = '/api/emails/graph/sync';
      } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
        syncEndpoint = '/api/emails/gmail/sync';
      } else {
        syncEndpoint = '/api/email/sync-to-database';
      }
      
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${syncEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            accountId: account.id,
            maxEmails: 100,
            delta: true
          })
        });
        
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Synced ${result.totalSaved || 0} new emails for ${account.email}`);
          
          await supabase
            .from('email_accounts')
            .update({
              last_sync_at: new Date().toISOString(),
              sync_error: null
            })
            .eq('id', accountId);
        }
      } catch (err) {
        console.error(`Sync failed for ${account.email}:`, err);
      }
    }
    
    return NextResponse.json({
      success: true,
      account: account.email,
      realTimeSyncActive: true,
      lastSync: account.last_sync_at,
      minutesSinceSync: Math.round(minutesSinceSync)
    });
    
  } catch (error) {
    console.error('Error ensuring sync:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure sync'
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return POST(request);
}