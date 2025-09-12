/**
 * NUCLEAR CLEANUP - Force stop everything and clean database
 * 
 * This script forcibly stops all sync processes and completely cleans the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function nuclearCleanup() {
  console.log('💣 NUCLEAR CLEANUP - Stopping ALL sync and cleaning database...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Force delete ALL emails (multiple methods)
    console.log('🗑️  FORCE DELETING ALL EMAILS...');
    
    // Method 1: Direct delete with service role
    try {
      const { error: deleteIndexError } = await supabase
        .from('email_index')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
        
      console.log('✅ Deleted email_index:', deleteIndexError ? 'FAILED' : 'SUCCESS');
    } catch (e) {
      console.log('❌ email_index delete failed:', e.message);
    }

    try {
      const { error: deleteContentError } = await supabase
        .from('email_content_cache')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
        
      console.log('✅ Deleted email_content_cache:', deleteContentError ? 'FAILED' : 'SUCCESS');
    } catch (e) {
      console.log('❌ email_content_cache delete failed:', e.message);
    }

    try {
      const { error: deleteThreadsError } = await supabase
        .from('email_threads')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
        
      console.log('✅ Deleted email_threads:', deleteThreadsError ? 'FAILED' : 'SUCCESS');
    } catch (e) {
      console.log('❌ email_threads delete failed:', e.message);
    }

    // 2. FORCE DISABLE ALL ACCOUNTS AND SYNC
    console.log('\n🛑 FORCE DISABLING ALL SYNC...');
    
    const { error: disableError } = await supabase
      .from('email_accounts')
      .update({
        is_active: false,
        real_time_sync_active: false,
        webhook_active: false,
        polling_interval: 999999, // Essentially never
        sync_error: 'NUCLEAR CLEANUP - ALL SYNC DISABLED',
        last_sync_at: null,
        last_full_sync_at: null,
        last_sync_attempt_at: null,
        updated_at: new Date().toISOString()
      })
      .gte('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Disabled all accounts:', disableError ? 'FAILED' : 'SUCCESS');
    if (disableError) {
      console.log('❌ Disable error:', disableError.message);
    }

    // 3. Verify cleanup
    console.log('\n🔍 VERIFYING CLEANUP...');
    
    const results = await Promise.allSettled([
      supabase.from('email_index').select('*', { count: 'exact', head: true }),
      supabase.from('email_content_cache').select('*', { count: 'exact', head: true }),
      supabase.from('email_threads').select('*', { count: 'exact', head: true })
    ]);

    console.log('📊 FINAL COUNTS:');
    console.log(`  email_index: ${results[0].status === 'fulfilled' ? results[0].value.count : 'ERROR'}`);
    console.log(`  email_content_cache: ${results[1].status === 'fulfilled' ? results[1].value.count : 'ERROR'}`);
    console.log(`  email_threads: ${results[2].status === 'fulfilled' ? results[2].value.count : 'ERROR'}`);

    // 4. Show account status
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('email, is_active, real_time_sync_active, sync_error')
      .order('email');

    console.log('\n📋 ACCOUNT STATUS:');
    accounts?.forEach(acc => {
      const status = acc.is_active ? '🟢' : '🔴';
      const rtSync = acc.real_time_sync_active ? '⚡' : '⛔';
      console.log(`  ${status}${rtSync} ${acc.email}`);
      if (acc.sync_error) {
        console.log(`      ${acc.sync_error}`);
      }
    });

    console.log('\n💣 NUCLEAR CLEANUP COMPLETE');
    console.log('🚨 ALL SYNC PROCESSES SHOULD BE STOPPED');
    console.log('📋 Next: Restart Next.js server to clear any running timers');
    
    return { success: true };

  } catch (error) {
    console.error('❌ Nuclear cleanup failed:', error.message);
    throw error;
  }
}

nuclearCleanup()
  .then(() => {
    console.log('\n🎯 CLEANUP SUCCESS - RESTART NEXT.JS SERVER NOW');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    process.exit(1);
  });