/**
 * Force sync script for Zarfin's email account
 * This will fetch ALL new emails and process them through AI
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forceSync() {
  console.log('🔄 Starting force sync for Zarfin\'s account...\n');
  
  try {
    // Find Zarfin's email account
    const { data: accounts, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .ilike('email', '%zarfin%');
    
    if (accountError || !accounts?.length) {
      console.error('❌ Could not find Zarfin\'s email account:', accountError);
      return;
    }
    
    const account = accounts[0];
    console.log(`📧 Found account: ${account.email} (${account.provider_type})`);
    console.log(`Last sync: ${account.last_sync_at || 'Never'}`);
    console.log(`Account ID: ${account.id}\n`);
    
    // Clear any existing sync state to force full sync
    console.log('🧹 Clearing sync state for fresh sync...');
    await supabase
      .from('email_sync_state')
      .delete()
      .eq('account_id', account.id);
    
    // Determine the right sync endpoint based on provider
    let syncUrl;
    if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/graph/sync`;
    } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/gmail/sync`;
    } else {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/sync-to-database`;
    }
    
    console.log(`🚀 Syncing emails from ${syncUrl}...\n`);
    
    // Perform the sync
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || process.env.INTERNAL_API_KEY || ''}`
      },
      body: JSON.stringify({
        accountId: account.id,
        maxEmails: 5000, // Get ALL emails
        delta: false, // Force full sync, not delta
        folder: 'inbox'
      })
    });
    
    const result = await response.json();
    
    if (result.success || result.totalSaved > 0) {
      console.log('✅ Sync successful!');
      console.log(`📊 Emails synced: ${result.totalSaved || result.importCount || 0}`);
      if (result.breakdown) {
        console.log(`   - Inbox: ${result.breakdown.inbox || 0}`);
        console.log(`   - Sent: ${result.breakdown.sent || 0}`);
      }
      
      // Now trigger AI processing
      console.log('\n🤖 Triggering AI processing...');
      
      // Get recent emails for processing
      const { data: recentEmails } = await supabase
        .from('email_index')
        .select('*')
        .eq('email_account_id', account.id)
        .order('received_at', { ascending: false })
        .limit(100);
      
      if (recentEmails?.length) {
        console.log(`Processing ${recentEmails.length} emails through AI...`);
        
        // Trigger learning
        const learningResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/learning/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET || process.env.INTERNAL_API_KEY || ''}`
          },
          body: JSON.stringify({
            userId: account.user_id,
            accountId: account.id,
            mode: 'incremental',
            priority: 'high'
          })
        });
        
        const learningResult = await learningResponse.json();
        if (learningResult.success) {
          console.log('✅ AI learning job started successfully');
          console.log(`   Session ID: ${learningResult.sessionId}`);
        } else {
          console.log('⚠️ AI learning job failed:', learningResult.error);
        }
      }
      
      // Update account status
      await supabase
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          last_full_sync_at: new Date().toISOString(),
          sync_error: null
        })
        .eq('id', account.id);
      
      console.log('\n✅ Force sync completed successfully!');
      
      // Also sync sent folder for better AI learning
      console.log('\n📤 Syncing sent folder for AI learning...');
      const sentResponse = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET || process.env.INTERNAL_API_KEY || ''}`
        },
        body: JSON.stringify({
          accountId: account.id,
          maxEmails: 2000,
          delta: false,
          folder: 'sent'
        })
      });
      
      const sentResult = await sentResponse.json();
      if (sentResult.success) {
        console.log(`✅ Synced ${sentResult.totalSaved || 0} sent emails`);
      }
      
    } else {
      console.error('❌ Sync failed:', result.error || 'Unknown error');
    }
    
    // Finally, set up real-time sync
    console.log('\n🔄 Setting up real-time sync...');
    const rtResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/start-realtime-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || process.env.INTERNAL_API_KEY || ''}`
      },
      body: JSON.stringify({
        accountId: account.id
      })
    });
    
    const rtResult = await rtResponse.json();
    if (rtResult.success) {
      console.log('✅ Real-time sync activated');
      console.log(`   Polling interval: ${rtResult.pollingInterval || 5} minutes`);
    } else {
      console.log('⚠️ Real-time sync setup failed:', rtResult.error);
    }
    
  } catch (error) {
    console.error('❌ Force sync failed:', error);
  }
}

// Run the sync
forceSync().then(() => {
  console.log('\n🎉 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});