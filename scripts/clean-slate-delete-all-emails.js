/**
 * CLEAN SLATE - DELETE ALL EMAILS
 * 
 * Safely deletes all emails from database to start fresh
 * Keeps account settings intact, only removes email data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanSlateDeleteEmails() {
  console.log('🧹 CLEAN SLATE - Deleting all emails from database...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Get current email counts
    console.log('📊 Checking current email counts...');
    
    const { count: emailIndexCount, error: indexCountError } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    const { count: emailContentCount, error: contentCountError } = await supabase
      .from('email_content_cache')
      .select('*', { count: 'exact', head: true });

    const { count: emailsCount, error: emailsCountError } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true });

    if (indexCountError || contentCountError || emailsCountError) {
      throw new Error('Failed to count emails');
    }

    console.log(`📧 Current email counts:`);
    console.log(`  - email_index: ${emailIndexCount || 0} records`);
    console.log(`  - email_content_cache: ${emailContentCount || 0} records`);
    console.log(`  - emails: ${emailsCount || 0} records`);

    // 2. Delete from all email-related tables
    console.log('\n🗑️  Deleting emails from all tables...');

    // Delete email_index (main email metadata)
    const { error: deleteIndexError } = await supabase
      .from('email_index')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteIndexError) {
      throw new Error('Failed to delete email_index: ' + deleteIndexError.message);
    }
    console.log('✅ Deleted all email_index records');

    // Delete email_content_cache (email content)
    const { error: deleteContentError } = await supabase
      .from('email_content_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteContentError) {
      console.warn('⚠️ Failed to delete email_content_cache (might not exist):', deleteContentError.message);
    } else {
      console.log('✅ Deleted all email_content_cache records');
    }

    // Delete emails table (if exists)
    const { error: deleteEmailsError } = await supabase
      .from('emails')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteEmailsError) {
      console.warn('⚠️ Failed to delete emails table (might not exist):', deleteEmailsError.message);
    } else {
      console.log('✅ Deleted all emails table records');
    }

    // Delete email_threads (if exists)
    const { error: deleteThreadsError } = await supabase
      .from('email_threads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteThreadsError) {
      console.warn('⚠️ Failed to delete email_threads (might not exist):', deleteThreadsError.message);
    } else {
      console.log('✅ Deleted all email_threads records');
    }

    // 3. Reset sync timestamps for all accounts
    console.log('\n🔄 Resetting sync timestamps...');
    
    const { error: resetTimestampsError } = await supabase
      .from('email_accounts')
      .update({
        last_sync_at: null,
        last_full_sync_at: null,
        last_sync_attempt_at: null,
        sync_error: 'Clean slate - ready for fresh sync',
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (resetTimestampsError) {
      throw new Error('Failed to reset timestamps: ' + resetTimestampsError.message);
    }
    
    console.log('✅ Reset all account sync timestamps');

    // 4. Verify clean slate
    console.log('\n🔍 Verifying clean slate...');
    
    const { count: verifyIndexCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    const { count: verifyContentCount } = await supabase
      .from('email_content_cache')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Post-deletion counts:');
    console.log(`  - email_index: ${verifyIndexCount || 0} records`);
    console.log(`  - email_content_cache: ${verifyContentCount || 0} records`);

    // 5. Show account status
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('email, is_active, sync_error')
      .order('email');

    console.log('\n📋 Account Status:');
    accounts.forEach(acc => {
      const status = acc.is_active ? '🟢 Active' : '🔴 Disabled';
      console.log(`  ${status} ${acc.email}`);
      if (acc.sync_error) {
        console.log(`    ℹ️  ${acc.sync_error}`);
      }
    });

    console.log('\n✅ CLEAN SLATE COMPLETE');
    console.log('📋 Database is now empty and ready for controlled sync');
    console.log('🎯 Next: Test sync with Zarfin (50 received + 50 sent)');
    
    return {
      success: true,
      deletedEmails: (emailIndexCount || 0) + (emailContentCount || 0) + (emailsCount || 0),
      activeAccount: 'zarfin.jakupovic@withcar.si'
    };

  } catch (error) {
    console.error('❌ Clean slate deletion failed:', error.message);
    throw error;
  }
}

// Run the clean slate deletion
cleanSlateDeleteEmails()
  .then(result => {
    console.log(`\n🎉 SUCCESS - CLEAN SLATE ACHIEVED`);
    console.log(`Deleted ${result.deletedEmails} email records`);
    console.log(`Active account: ${result.activeAccount}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ CLEAN SLATE FAILED:', error.message);
    process.exit(1);
  });