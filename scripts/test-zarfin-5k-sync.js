/**
 * Test script to sync 5000+ emails for Zarfin's account
 * This tests the new pagination functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test5kSync() {
  console.log('🧪 Testing 5000 email sync for Zarfin\'s account...\n');
  
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
    console.log(`Account ID: ${account.id}`);
    
    // Check current email count
    const { count: currentCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact' })
      .eq('email_account_id', account.id);
    
    console.log(`📊 Current emails in database: ${currentCount || 0}\n`);
    
    // Clear sync state for fresh sync
    console.log('🧹 Clearing sync state for fresh sync...');
    await supabase
      .from('email_sync_state')
      .delete()
      .eq('account_id', account.id);
    
    // Determine sync endpoint based on provider
    let syncUrl;
    if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/graph/sync`;
    } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/gmail/sync`;
    } else {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/sync-to-database`;
    }
    
    console.log(`🔄 Starting sync with 5000 emails target...`);
    console.log(`Endpoint: ${syncUrl}\n`);
    
    const startTime = Date.now();
    
    // Make sync request with 5000 emails
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: account.id,
        maxEmails: 5000,
        delta: false, // Force full sync
        folder: 'inbox'
      })
    });
    
    const result = await response.json();
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`⏱️  Sync completed in ${duration} seconds\n`);
    
    if (result.success || result.totalSaved > 0) {
      console.log('✅ Sync successful!');
      console.log(`📈 New emails synced: ${result.totalSaved || result.importCount || 0}`);
      
      // Check final count
      const { count: finalCount } = await supabase
        .from('email_index')
        .select('*', { count: 'exact' })
        .eq('email_account_id', account.id);
      
      console.log(`📊 Total emails now in database: ${finalCount || 0}`);
      console.log(`🔢 Net increase: ${(finalCount || 0) - (currentCount || 0)}`);
      
      // Show date range of emails
      const { data: dateRange } = await supabase
        .from('email_index')
        .select('received_at, sent_at')
        .eq('email_account_id', account.id)
        .order('received_at', { ascending: false })
        .limit(1);
      
      const { data: oldestEmails } = await supabase
        .from('email_index')
        .select('received_at, sent_at')
        .eq('email_account_id', account.id)
        .order('received_at', { ascending: true })
        .limit(1);
      
      if (dateRange?.length && oldestEmails?.length) {
        const newest = new Date(dateRange[0].received_at || dateRange[0].sent_at);
        const oldest = new Date(oldestEmails[0].received_at || oldestEmails[0].sent_at);
        console.log(`📅 Date range: ${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()}`);
        
        const daysCovered = Math.ceil((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📆 Coverage: ${daysCovered} days (~${Math.round(daysCovered / 30)} months)`);
      }
      
      // Now check if we can start AI learning
      if ((finalCount || 0) >= 1000) {
        console.log('\n🤖 Ready for AI learning!');
        console.log('Next step: Run initial learning with:');
        console.log(`POST /api/email/learning/initial`);
        console.log(`Body: { "maxEmails": ${finalCount}, "accountId": "${account.id}" }`);
      } else {
        console.log('\n⚠️  Need more emails for effective AI learning');
        console.log(`Recommendation: Try to get at least 1000 emails (currently ${finalCount || 0})`);
      }
      
    } else {
      console.error('❌ Sync failed:', result.error || 'Unknown error');
      console.error('Response:', result);
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
}

// Run the test
test5kSync();