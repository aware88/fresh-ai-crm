/**
 * Sync all emails for all active accounts
 * Uses service role to bypass authentication
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAllAccounts() {
  console.log('🔄 Starting email sync for all active accounts...\n');
  
  try {
    // Get all active email accounts
    const { data: accounts, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_active', true);
    
    if (accountError || !accounts?.length) {
      console.error('❌ No active email accounts found:', accountError);
      return;
    }
    
    console.log(`📧 Found ${accounts.length} active email accounts\n`);
    
    for (const account of accounts) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📧 Processing: ${account.email}`);
      console.log(`   Provider: ${account.provider_type}`);
      console.log(`   Last sync: ${account.last_sync_at || 'Never'}`);
      console.log(`   Account ID: ${account.id}`);
      
      try {
        // Get existing emails count
        const { count: existingCount } = await supabase
          .from('email_index')
          .select('*', { count: 'exact', head: true })
          .eq('email_account_id', account.id);
        
        console.log(`   Existing emails: ${existingCount || 0}`);
        
        // For Microsoft/Outlook accounts, we need to handle token refresh
        if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
          console.log('\n⚠️  Microsoft account - requires OAuth token');
          console.log('   Please sync through the web interface at /dashboard/email');
          continue;
        }
        
        // For IMAP accounts, we can sync directly
        if (account.provider_type === 'imap') {
          console.log('\n🔄 Syncing IMAP account...');
          
          // Get latest emails from database
          const { data: latestEmail } = await supabase
            .from('email_index')
            .select('received_at')
            .eq('email_account_id', account.id)
            .order('received_at', { ascending: false })
            .limit(1)
            .single();
          
          const sinceDate = latestEmail?.received_at 
            ? new Date(latestEmail.received_at)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
          
          console.log(`   Fetching emails since: ${sinceDate.toISOString()}`);
          
          // Note: IMAP sync requires the actual email credentials which we don't store
          // The sync must be triggered through the API with proper authentication
          console.log('   ⚠️ IMAP sync requires credentials - use web interface');
          continue;
        }
        
        // Update sync timestamp even if we couldn't sync
        // This prevents constant retry attempts
        await supabase
          .from('email_accounts')
          .update({
            last_sync_attempt_at: new Date().toISOString()
          })
          .eq('id', account.id);
        
      } catch (error) {
        console.error(`\n❌ Error processing ${account.email}:`, error.message);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Sync process completed');
    console.log('\n📝 Note: To properly sync emails with OAuth providers (Microsoft/Gmail):');
    console.log('   1. Sign in to the web app');
    console.log('   2. Go to /dashboard/email');
    console.log('   3. The auto-sync will trigger automatically');
    console.log('\n   Or manually trigger sync at /settings/email-accounts');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the sync
syncAllAccounts().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});