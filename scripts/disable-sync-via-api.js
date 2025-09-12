#!/usr/bin/env node
/**
 * Disable email sync via API calls
 * This stops the authentication spam by disabling sync for all accounts
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function disableAllSync() {
  console.log('🛑 Disabling all email sync to stop authentication spam...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // First, get all accounts with sync enabled
    const { data: accounts, error: selectError } = await supabase
      .from('email_accounts')
      .select('id, email, real_time_sync_active')
      .eq('real_time_sync_active', true);

    if (selectError) {
      console.error('❌ Error fetching accounts:', selectError);
      return;
    }

    console.log(`📧 Found ${accounts?.length || 0} accounts with sync enabled`);

    if (accounts && accounts.length > 0) {
      // Disable sync for all accounts
      const { data, error: updateError } = await supabase
        .from('email_accounts')
        .update({
          real_time_sync_active: false,
          webhook_active: false,
          webhook_id: null,
          sync_error: 'Sync disabled due to authentication issues - ' + new Date().toISOString()
        })
        .eq('real_time_sync_active', true)
        .select('email, real_time_sync_active');

      if (updateError) {
        console.error('❌ Error updating accounts:', updateError);
        return;
      }

      console.log('✅ Successfully disabled sync for all accounts:');
      data?.forEach(account => {
        console.log(`   📧 ${account.email}: sync disabled`);
      });
    } else {
      console.log('ℹ️  No accounts found with sync enabled');
    }

    // Also clear any sync state
    const { error: stateError } = await supabase
      .from('email_sync_state')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (stateError && stateError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.warn('⚠️  Warning: Could not clear sync state:', stateError.message);
    } else {
      console.log('✅ Cleared sync state');
    }

    console.log('\n🎉 All email sync has been disabled');
    console.log('   The authentication spam should stop now');
    console.log('   You can re-enable sync after fixing the auth issues');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

disableAllSync();