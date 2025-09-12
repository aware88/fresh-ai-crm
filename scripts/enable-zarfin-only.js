/**
 * ENABLE ZARFIN ONLY
 * 
 * Enables only Zarfin account for controlled testing with proper settings
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function enableZarfinOnly() {
  console.log('🎯 ENABLING ZARFIN ONLY - Controlled test setup...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verify database is clean
    const { count: emailCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current emails in database: ${emailCount || 0}`);
    
    if (emailCount && emailCount > 0) {
      throw new Error('Database is not clean! Please run nuclear cleanup first.');
    }

    // 2. Enable ONLY Zarfin account with controlled settings
    const { error: enableError } = await supabase
      .from('email_accounts')
      .update({
        is_active: true,
        real_time_sync_active: false, // Keep disabled for controlled sync
        webhook_active: false,
        polling_interval: 999999, // Essentially never (controlled sync only)
        sync_error: 'Ready for controlled sync test',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'zarfin.jakupovic@withcar.si');

    if (enableError) {
      throw new Error('Failed to enable Zarfin account: ' + enableError.message);
    }

    // 3. Verify Zarfin account setup
    const { data: zarfinAccount } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .single();

    if (!zarfinAccount) {
      throw new Error('Zarfin account not found!');
    }

    console.log('✅ Zarfin account enabled for testing:');
    console.log(`   Email: ${zarfinAccount.email}`);
    console.log(`   Provider: ${zarfinAccount.provider_type}`);
    console.log(`   Active: ${zarfinAccount.is_active}`);
    console.log(`   Real-time sync: ${zarfinAccount.real_time_sync_active} (disabled for controlled sync)`);
    console.log(`   Account ID: ${zarfinAccount.id}`);

    // 4. Show all account status
    const { data: allAccounts } = await supabase
      .from('email_accounts')
      .select('email, is_active, real_time_sync_active, sync_error')
      .order('email');

    console.log('\n📋 ALL ACCOUNT STATUS:');
    allAccounts?.forEach(acc => {
      const status = acc.is_active ? '🟢 ACTIVE' : '🔴 DISABLED';
      const rtSync = acc.real_time_sync_active ? '⚡ RT-Sync' : '⛔ No-RT-Sync';
      console.log(`  ${status} ${rtSync} ${acc.email}`);
      if (acc.sync_error && acc.email === 'zarfin.jakupovic@withcar.si') {
        console.log(`    ✅ ${acc.sync_error}`);
      }
    });

    console.log('\n🎯 SETUP COMPLETE');
    console.log('📋 Ready for controlled sync test:');
    console.log('   1. Start Next.js server: npm run dev');
    console.log('   2. Login with Zarfin account');
    console.log('   3. Run: node scripts/test-controlled-sync-zarfin.js');
    
    return {
      success: true,
      zarfinAccountId: zarfinAccount.id,
      zarfinEmail: zarfinAccount.email
    };

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

enableZarfinOnly()
  .then(result => {
    console.log('\n✅ ZARFIN ACCOUNT READY FOR TESTING');
    console.log(`Account ID: ${result.zarfinAccountId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ SETUP FAILED:', error.message);
    process.exit(1);
  });