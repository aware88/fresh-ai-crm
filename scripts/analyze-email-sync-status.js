/**
 * Analyze email sync status for all accounts
 * Diagnose why emails aren't syncing automatically
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeEmailSync() {
  console.log('🔍 ANALYZING EMAIL SYNC SYSTEM\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    // 1. Get all email accounts
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`📊 Total Email Accounts: ${accounts.length}\n`);
    
    // Analyze each account
    for (const account of accounts) {
      console.log(`\n📧 Account: ${account.email}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Provider: ${account.provider_type}`);
      console.log(`   Active: ${account.is_active ? '✅' : '❌'}`);
      console.log(`   Created: ${new Date(account.created_at).toLocaleDateString()}`);
      console.log(`   Last Sync: ${account.last_sync_at ? new Date(account.last_sync_at).toLocaleString() : '❌ NEVER'}`);
      
      // Calculate time since last sync
      if (account.last_sync_at) {
        const lastSyncTime = new Date(account.last_sync_at).getTime();
        const hoursSinceSync = Math.round((Date.now() - lastSyncTime) / (1000 * 60 * 60));
        const daysSinceSync = Math.round(hoursSinceSync / 24);
        
        if (daysSinceSync > 0) {
          console.log(`   ⚠️  Last synced ${daysSinceSync} days ago`);
        } else if (hoursSinceSync > 1) {
          console.log(`   ⚠️  Last synced ${hoursSinceSync} hours ago`);
        } else {
          console.log(`   ✅ Recently synced`);
        }
      }
      
      // Check sync configuration
      console.log(`\n   Sync Configuration:`);
      console.log(`   - Real-time sync active: ${account.real_time_sync_active ? '✅' : '❌ NOT ACTIVE'}`);
      console.log(`   - Webhook active: ${account.webhook_active ? '✅' : '❌'}`);
      console.log(`   - Webhook ID: ${account.webhook_id || 'None'}`);
      console.log(`   - Setup completed: ${account.setup_completed ? '✅' : '❌'}`);
      console.log(`   - Last full sync: ${account.last_full_sync_at || 'Never'}`);
      console.log(`   - Sync error: ${account.sync_error || 'None'}`);
      
      // Get email count
      const { count: emailCount } = await supabase
        .from('email_index')
        .select('*', { count: 'exact', head: true })
        .eq('email_account_id', account.id);
      
      console.log(`   - Emails in database: ${emailCount || 0}`);
      
      // Get recent emails
      const { data: recentEmails } = await supabase
        .from('email_index')
        .select('received_at, sent_at')
        .eq('email_account_id', account.id)
        .order('received_at', { ascending: false })
        .limit(1);
      
      if (recentEmails?.length > 0) {
        const mostRecentDate = recentEmails[0].received_at || recentEmails[0].sent_at;
        const daysSinceLastEmail = Math.round((Date.now() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - Most recent email: ${daysSinceLastEmail} days ago`);
        
        if (daysSinceLastEmail > 7) {
          console.log(`   ⚠️  WARNING: No recent emails - sync may be broken!`);
        }
      }
      
      // Diagnose issues
      console.log(`\n   🔍 Diagnosis:`);
      const issues = [];
      
      if (!account.is_active) {
        issues.push('Account is not active');
      }
      if (!account.real_time_sync_active) {
        issues.push('Real-time sync is NOT enabled');
      }
      if (!account.last_sync_at) {
        issues.push('Account has NEVER been synced');
      } else {
        const hoursSinceSync = (Date.now() - new Date(account.last_sync_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync > 24) {
          issues.push(`Not synced in ${Math.round(hoursSinceSync)} hours`);
        }
      }
      if (!account.setup_completed) {
        issues.push('Initial setup not completed');
      }
      if (account.sync_error) {
        issues.push(`Sync error: ${account.sync_error}`);
      }
      
      if (issues.length > 0) {
        console.log(`   ❌ Issues found:`);
        issues.forEach(issue => console.log(`      - ${issue}`));
      } else {
        console.log(`   ✅ No issues detected`);
      }
      
      console.log('\n───────────────────────────────────────────────────────────────');
    }
    
    // Overall system analysis
    console.log('\n\n📊 SYSTEM ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const activeAccounts = accounts.filter(a => a.is_active);
    const realtimeSyncAccounts = accounts.filter(a => a.real_time_sync_active);
    const recentlySynced = accounts.filter(a => {
      if (!a.last_sync_at) return false;
      const hoursSince = (Date.now() - new Date(a.last_sync_at).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });
    const neverSynced = accounts.filter(a => !a.last_sync_at);
    const hasErrors = accounts.filter(a => a.sync_error);
    
    console.log(`Total accounts: ${accounts.length}`);
    console.log(`Active accounts: ${activeAccounts.length}`);
    console.log(`Real-time sync enabled: ${realtimeSyncAccounts.length} (${Math.round(realtimeSyncAccounts.length / accounts.length * 100)}%)`);
    console.log(`Recently synced (< 24h): ${recentlySynced.length}`);
    console.log(`Never synced: ${neverSynced.length}`);
    console.log(`Has sync errors: ${hasErrors.length}`);
    
    // Recommendations
    console.log('\n\n🚀 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (realtimeSyncAccounts.length < activeAccounts.length) {
      console.log('1. ⚠️  CRITICAL: Enable real-time sync for all active accounts');
      console.log('   - Only ' + realtimeSyncAccounts.length + ' of ' + activeAccounts.length + ' active accounts have real-time sync');
      console.log('   - Run: npm run sync:enable-realtime\n');
    }
    
    if (neverSynced.length > 0) {
      console.log('2. ⚠️  Some accounts have NEVER been synced');
      console.log('   - Affected accounts: ' + neverSynced.map(a => a.email).join(', '));
      console.log('   - Run initial sync for these accounts\n');
    }
    
    if (hasErrors.length > 0) {
      console.log('3. ⚠️  Some accounts have sync errors');
      console.log('   - Check error logs and fix authentication issues\n');
    }
    
    console.log('📝 SOLUTION: The main issue is that real-time sync is not enabled for existing accounts.');
    console.log('   This is why Zarfin and other existing users don\'t get new emails automatically.\n');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run analysis
analyzeEmailSync().then(() => {
  console.log('\n✅ Analysis complete\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});