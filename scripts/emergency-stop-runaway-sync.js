/**
 * EMERGENCY: Stop Runaway Email Sync Process
 * 
 * This script immediately disables the aggressive real-time sync that's causing
 * 33k+ emails to be synced instead of the planned 10k limit.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function emergencyStopSync() {
  console.log('🚨 EMERGENCY: Stopping runaway email sync process...');
  
  // Use service role for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Disable real-time sync for all accounts
    const { data: accounts, error: fetchError } = await supabase
      .from('email_accounts')
      .select('id, email, real_time_sync_active, polling_interval')
      .eq('is_active', true);

    if (fetchError) {
      throw new Error('Failed to fetch accounts: ' + fetchError.message);
    }

    console.log(`📊 Found ${accounts.length} active accounts with sync enabled`);
    
    for (const account of accounts) {
      console.log(`  - ${account.email}: real_time_sync=${account.real_time_sync_active}, polling=${account.polling_interval}min`);
    }

    // 2. Update all accounts to disable aggressive sync
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({
        real_time_sync_active: false,
        polling_interval: 60, // Change from 2 minutes to 60 minutes
        sync_error: 'Sync temporarily disabled to prevent runaway process',
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true);

    if (updateError) {
      throw new Error('Failed to update accounts: ' + updateError.message);
    }

    console.log('✅ Successfully disabled real-time sync for all accounts');
    console.log('📈 Changed polling interval from 2 minutes to 60 minutes');
    
    // 3. Show current email counts
    const { data: counts, error: countError } = await supabase
      .from('email_index')
      .select('email_account_id')
      .then(result => {
        if (result.error) throw result.error;
        
        const accountCounts = {};
        result.data.forEach(email => {
          accountCounts[email.email_account_id] = (accountCounts[email.email_account_id] || 0) + 1;
        });
        
        return { data: accountCounts, error: null };
      });

    if (countError) {
      console.warn('Could not fetch email counts:', countError.message);
    } else {
      console.log('\n📊 Current email counts by account:');
      for (const account of accounts) {
        const count = counts.data[account.id] || 0;
        console.log(`  - ${account.email}: ${count} emails`);
      }
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('1. The runaway sync process has been stopped');
    console.log('2. You can now implement controlled sync with proper limits');
    console.log('3. Use maxEmails parameter to limit sync to 5000 received + 5000 sent');
    console.log('4. Consider implementing user-based sync quotas');
    
    return {
      success: true,
      accountsUpdated: accounts.length,
      totalEmails: Object.values(counts.data || {}).reduce((a, b) => a + b, 0)
    };

  } catch (error) {
    console.error('❌ Emergency stop failed:', error.message);
    throw error;
  }
}

// Run the emergency stop
emergencyStopSync()
  .then(result => {
    console.log('\n✅ EMERGENCY STOP COMPLETE');
    console.log(`Updated ${result.accountsUpdated} accounts`);
    console.log(`Total emails in database: ${result.totalEmails}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ EMERGENCY STOP FAILED:', error.message);
    process.exit(1);
  });