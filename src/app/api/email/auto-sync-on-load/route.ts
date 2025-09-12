import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * SIMPLE AUTO-SYNC SOLUTION
 * 
 * This endpoint is called when users open their email
 * It automatically syncs emails if needed (> 5 minutes old)
 * Works with existing database schema - no migrations needed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { accountId } = await request.json();
    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 });
    }
    
    // Get account from database
    const accountResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/dashboard/email-accounts`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    // Check last sync time from account
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const getAccountResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_accounts?id=eq.${accountId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    const accounts = await getAccountResponse.json();
    const account = accounts[0];
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Calculate time since last sync
    const lastSync = account.last_sync_at ? new Date(account.last_sync_at).getTime() : 0;
    const minutesSinceSync = (Date.now() - lastSync) / (1000 * 60);
    
    // Also check if we have recent emails
    const supabaseCheck = await fetch(
      `${supabaseUrl}/rest/v1/email_index?email_account_id=eq.${accountId}&select=received_at&order=received_at.desc&limit=1`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    const recentEmails = await supabaseCheck.json();
    const mostRecentEmailTime = recentEmails?.[0]?.received_at ? new Date(recentEmails[0].received_at).getTime() : 0;
    const daysSinceLastEmail = (Date.now() - mostRecentEmailTime) / (1000 * 60 * 60 * 24);
    
    console.log(`📧 Auto-sync check for ${account.email}:`);
    console.log(`   - ${Math.round(minutesSinceSync)} minutes since last sync`);
    console.log(`   - ${Math.round(daysSinceLastEmail)} days since last email`);
    
    // Only sync if it's been more than 30 minutes since last sync AND emails are old
    const needsSync = minutesSinceSync >= 30 && daysSinceLastEmail > 1; // Much less aggressive
    
    // If synced recently AND has recent emails, skip
    if (!needsSync) {
      return NextResponse.json({
        success: true,
        message: 'Recently synced',
        minutesSinceSync: Math.round(minutesSinceSync),
        daysSinceLastEmail: Math.round(daysSinceLastEmail),
        synced: false
      });
    }
    
    // PERFORM AUTOMATIC SYNC
    console.log(`🔄 Auto-syncing ${account.email} (${account.provider_type})...`);
    
    let syncEndpoint = '';
    if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
      syncEndpoint = '/api/emails/graph/sync';
    } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
      syncEndpoint = '/api/emails/gmail/sync';
    } else {
      syncEndpoint = '/api/email/sync-to-database';
    }
    
    // Perform the sync
    const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${syncEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        accountId: account.id,
        maxEmails: 200,
        delta: true, // Use incremental sync
        folder: 'inbox'
      })
    });
    
    const syncResult = await syncResponse.json();
    
    if (syncResult.success || syncResult.totalSaved > 0) {
      const emailCount = syncResult.totalSaved || syncResult.importCount || 0;
      console.log(`✅ Auto-sync successful: ${emailCount} new emails for ${account.email}`);
      
      // Update last sync timestamp
      await fetch(
        `${supabaseUrl}/rest/v1/email_accounts?id=eq.${accountId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            last_sync_at: new Date().toISOString()
          })
        }
      );
      
      // Trigger AI processing if we got new emails
      if (emailCount > 0) {
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/learning/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            userId: session.user.id,
            accountId: account.id,
            mode: 'incremental'
          })
        }).catch(err => console.error('AI processing failed:', err));
      }
      
      return NextResponse.json({
        success: true,
        message: 'Auto-sync completed',
        emailsSynced: emailCount,
        minutesSinceLastSync: Math.round(minutesSinceSync),
        synced: true
      });
      
    } else {
      // Sync failed but don't block the user
      console.warn(`⚠️ Auto-sync failed for ${account.email}:`, syncResult.error);
      
      return NextResponse.json({
        success: true,
        message: 'Sync attempted',
        error: syncResult.error,
        synced: false
      });
    }
    
  } catch (error) {
    console.error('Auto-sync error:', error);
    // Don't fail the whole request - let user continue
    return NextResponse.json({
      success: true,
      message: 'Auto-sync skipped',
      error: error instanceof Error ? error.message : 'Unknown error',
      synced: false
    });
  }
}