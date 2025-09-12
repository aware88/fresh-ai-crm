/**
 * COMPLETE SYNC SHUTDOWN
 * 
 * Stops ALL syncing processes and disables all accounts except Zarfin
 * Prepares system for controlled clean-slate restart
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function completeSyncShutdown() {
  console.log('🛑 COMPLETE SYNC SHUTDOWN - Stopping all email sync processes...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Get all email accounts
    const { data: accounts, error: fetchError } = await supabase
      .from('email_accounts')
      .select('*');

    if (fetchError) {
      throw new Error('Failed to fetch accounts: ' + fetchError.message);
    }

    console.log(`📊 Found ${accounts.length} email accounts total`);
    
    // 2. Disable ALL accounts first
    const { error: disableAllError } = await supabase
      .from('email_accounts')
      .update({
        is_active: false,
        real_time_sync_active: false,
        webhook_active: false,
        polling_interval: 1440, // 24 hours
        sync_error: 'Account disabled for controlled restart',
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Add WHERE clause

    if (disableAllError) {
      throw new Error('Failed to disable all accounts: ' + disableAllError.message);
    }

    console.log('✅ All email accounts disabled');

    // 3. Keep ONLY Zarfin account active, but with controlled settings
    const zarfinAccount = accounts.find(acc => acc.email === 'zarfin.jakupovic@withcar.si');
    
    if (!zarfinAccount) {
      throw new Error('Zarfin account not found!');
    }

    const { error: enableZarfinError } = await supabase
      .from('email_accounts')
      .update({
        is_active: true,
        real_time_sync_active: false, // Keep disabled for now
        webhook_active: false,
        polling_interval: 1440, // 24 hours - essentially disabled
        sync_error: 'Ready for controlled test sync',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'zarfin.jakupovic@withcar.si');

    if (enableZarfinError) {
      throw new Error('Failed to enable Zarfin account: ' + enableZarfinError.message);
    }

    console.log('✅ Zarfin account re-enabled with controlled settings');

    // 4. Show final status
    const { data: finalStatus } = await supabase
      .from('email_accounts')
      .select('email, is_active, real_time_sync_active, sync_error')
      .order('email');

    console.log('\n📊 Final Account Status:');
    finalStatus.forEach(acc => {
      const status = acc.is_active ? '🟢 Active' : '🔴 Disabled';
      const rtSync = acc.real_time_sync_active ? '⚡ RT-Sync' : '⛔ No-Sync';
      console.log(`  ${status} ${rtSync} ${acc.email}`);
      if (acc.sync_error) {
        console.log(`    ℹ️  ${acc.sync_error}`);
      }
    });

    console.log('\n✅ SYNC SHUTDOWN COMPLETE');
    console.log('📋 Next Steps:');
    console.log('  1. Run clean-slate email deletion script');
    console.log('  2. Test sync with Zarfin: 50 received + 50 sent');
    console.log('  3. Verify results, then scale to 5000 + 5000');
    
    return {
      success: true,
      totalAccounts: accounts.length,
      activeAccounts: 1,
      zarfinAccountId: zarfinAccount.id
    };

  } catch (error) {
    console.error('❌ Sync shutdown failed:', error.message);
    throw error;
  }
}

// Run the complete shutdown
completeSyncShutdown()
  .then(result => {
    console.log(`\n🎯 READY FOR CLEAN RESTART`);
    console.log(`Total accounts: ${result.totalAccounts}`);
    console.log(`Active accounts: ${result.activeAccounts} (Zarfin only)`);
    console.log(`Zarfin account ID: ${result.zarfinAccountId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ SHUTDOWN FAILED:', error.message);
    process.exit(1);
  });