/**
 * Force sync Zarfin's emails RIGHT NOW
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
    console.log(`Last sync: ${account.last_sync_at}`);
    console.log(`Account ID: ${account.id}\n`);
    
    // Clear sync state to force FULL sync
    console.log('🧹 Clearing sync state for FULL sync...');
    await supabase
      .from('email_sync_state')
      .delete()
      .eq('account_id', account.id);
    
    // Update account to ensure sync is active
    console.log('✅ Ensuring real-time sync is active...');
    await supabase
      .from('email_accounts')
      .update({
        real_time_sync_active: true,
        setup_completed: true,
        webhook_active: true,
        polling_interval: 5
      })
      .eq('id', account.id);
    
    // Call the auto-sync endpoint directly
    console.log('🔄 Triggering FULL email sync NOW...\n');
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/auto-sync-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SYNC TRIGGERED SUCCESSFULLY!');
      console.log(`Results:`, result.results);
    } else {
      console.log('⚠️ Sync may have failed:', result.error);
    }
    
    // Check email count
    const { count } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('email_account_id', account.id);
    
    console.log(`\n📊 Total emails in database: ${count || 0}`);
    
    // Get most recent email
    const { data: recent } = await supabase
      .from('email_index')
      .select('subject, received_at')
      .eq('email_account_id', account.id)
      .order('received_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recent) {
      console.log(`📧 Most recent email: "${recent.subject}"`);
      console.log(`   Date: ${new Date(recent.received_at).toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceSyncNow().then(() => {
  console.log('\n✅ Done');
  process.exit(0);
});