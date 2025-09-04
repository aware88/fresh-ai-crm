#!/usr/bin/env node

/**
 * Fix email_index user_id links
 * This script updates email_index records to have the correct user_id from their email_accounts
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixEmailUserLinks() {
  console.log('🔧 Fixing Email User Links...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Get all email accounts with their user_ids
    console.log('📧 Fetching email accounts...');
    const { data: accounts, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, email, user_id');
    
    if (accountError) {
      console.error('Error fetching accounts:', accountError);
      return;
    }
    
    console.log(`Found ${accounts.length} email accounts`);
    accounts.forEach(acc => {
      console.log(`  - ${acc.email} (user: ${acc.user_id})`);
    });
    
    // Step 2: Update email_index records for each account
    console.log('\n🔄 Updating email_index records...');
    
    for (const account of accounts) {
      // Count emails for this account that need updating
      const { count: needsUpdate } = await supabase
        .from('email_index')
        .select('*', { count: 'exact', head: true })
        .eq('email_account_id', account.id)
        .is('user_id', null);
      
      if (needsUpdate > 0) {
        console.log(`\n  Updating ${needsUpdate} emails for ${account.email}...`);
        
        // Update all email_index records for this account
        const { error: updateError } = await supabase
          .from('email_index')
          .update({ user_id: account.user_id })
          .eq('email_account_id', account.id)
          .is('user_id', null);
        
        if (updateError) {
          console.error(`    ❌ Error updating emails:`, updateError.message);
        } else {
          console.log(`    ✅ Updated ${needsUpdate} emails with user_id: ${account.user_id}`);
        }
      } else {
        console.log(`  ✅ ${account.email} - all emails already have user_id`);
      }
    }
    
    // Step 3: Also update email_threads if needed
    console.log('\n🔄 Checking email_threads...');
    
    for (const account of accounts) {
      // Check if email_threads has user_id column
      const { data: threadSample } = await supabase
        .from('email_threads')
        .select('*')
        .limit(1);
      
      if (threadSample && threadSample[0] && 'user_id' in threadSample[0]) {
        const { count: threadsNeedUpdate } = await supabase
          .from('email_threads')
          .select('*', { count: 'exact', head: true })
          .eq('email_account_id', account.id)
          .is('user_id', null);
        
        if (threadsNeedUpdate > 0) {
          console.log(`  Updating ${threadsNeedUpdate} threads for ${account.email}...`);
          
          const { error: threadError } = await supabase
            .from('email_threads')
            .update({ user_id: account.user_id })
            .eq('email_account_id', account.id)
            .is('user_id', null);
          
          if (threadError) {
            console.error(`    ❌ Error:`, threadError.message);
          } else {
            console.log(`    ✅ Updated threads`);
          }
        }
      }
    }
    
    // Step 4: Verify the fix
    console.log('\n✅ Verifying the fix...');
    
    const { count: totalEmails } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });
    
    const { count: emailsWithUser } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'is', null);
    
    const { count: emailsWithoutUser } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null);
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`  Total emails: ${totalEmails}`);
    console.log(`  Emails with user_id: ${emailsWithUser}`);
    console.log(`  Emails without user_id: ${emailsWithoutUser}`);
    
    if (emailsWithoutUser === 0) {
      console.log('\n✅ All emails are now properly linked to users!');
    } else {
      console.log(`\n⚠️  ${emailsWithoutUser} emails still don't have user_id`);
      console.log('These might be from deleted accounts or need manual review.');
    }
    
    console.log('\n🎉 Fix complete! You should now be able to see your emails.');
    console.log('\n📝 Next steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Go to the email page');
    console.log('  3. Your emails should now be visible');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmailUserLinks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
