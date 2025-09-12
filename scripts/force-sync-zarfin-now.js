/**
 * Force sync Zarfin's emails RIGHT NOW - Direct approach
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forceSyncNow() {
  console.log('🚨 FORCE SYNCING ZARFIN\'S EMAILS NOW\n');
  
  try {
    // Find Zarfin's account
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('*')
      .ilike('email', '%zarfin%');
    
    if (!accounts?.length) {
      console.error('❌ Cannot find Zarfin\'s account');
      return;
    }
    
    const account = accounts[0];
    console.log(`📧 Found: ${account.email}`);
    console.log(`Provider: ${account.provider_type}`);
    console.log(`Last sync: ${account.last_sync_at}`);
    console.log(`Account ID: ${account.id}\n`);
    
    // Clear any sync state to force FULL sync
    console.log('🧹 Clearing sync state for FULL sync...');
    await supabase
      .from('email_sync_state')
      .delete()
      .eq('account_id', account.id);
    
    // Reset last_sync_at to force sync
    console.log('🔄 Resetting last sync timestamp...');
    await supabase
      .from('email_accounts')
      .update({
        last_sync_at: new Date('2024-01-01').toISOString(),
        real_time_sync_active: true,
        setup_completed: true
      })
      .eq('id', account.id);
    
    // Call the sync endpoint directly based on provider
    console.log('🔄 Triggering FULL email sync NOW...\n');
    
    let syncEndpoint = '';
    if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
      syncEndpoint = '/api/emails/graph/sync';
    } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
      syncEndpoint = '/api/emails/gmail/sync';
    } else {
      syncEndpoint = '/api/email/sync-to-database';
    }
    
    // Check which port the server is running on
    const port = process.env.PORT || '3002'; // Use 3002 since 3000 is in use
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${port}`;
    const response = await fetch(`${baseUrl}${syncEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-force': 'true' // Force flag
      },
      body: JSON.stringify({
        accountId: account.id,
        maxEmails: 5000, // Get all emails for AI learning
        delta: false, // Force FULL sync, not delta
        folder: 'inbox'
      })
    });
    
    const result = await response.json();
    
    if (result.success || result.totalSaved > 0) {
      console.log('✅ SYNC SUCCESSFUL!');
      console.log(`📊 Emails synced: ${result.totalSaved || result.importCount || 0}`);
      
      // Trigger AI processing
      console.log('\n🤖 Triggering AI processing...');
      const aiResponse = await fetch(`${baseUrl}/api/email/learning/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: account.user_id,
          accountId: account.id,
          mode: 'full'
        })
      });
      
      const aiResult = await aiResponse.json();
      if (aiResult.jobId) {
        console.log(`✅ AI job started: ${aiResult.jobId}`);
      }
    } else {
      console.log('⚠️ Sync may have failed:', result);
    }
    
    // Check what we have now
    const { count } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id);
    
    console.log(`\n📊 Total emails in database: ${count || 0}`);
    
    // Get most recent emails
    const { data: recent } = await supabase
      .from('email_index')
      .select('subject, received_at, sender_email')
      .eq('email_account_id', account.id)
      .order('received_at', { ascending: false })
      .limit(5);
    
    if (recent?.length) {
      console.log('\n📧 Most recent emails:');
      recent.forEach((email, idx) => {
        const date = new Date(email.received_at);
        const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   ${idx + 1}. "${email.subject}"`);
        console.log(`      From: ${email.sender_email}`);
        console.log(`      Date: ${date.toLocaleString()} (${daysAgo} days ago)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceSyncNow().then(() => {
  console.log('\n✅ Force sync complete');
  process.exit(0);
});