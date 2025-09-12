#!/usr/bin/env node
/**
 * Enable email sync for Zarfin's account only
 * This will allow his emails to sync without the authentication spam
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function enableZarfinSync() {
  console.log('🚀 Enabling email sync for Zarfin...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Enable sync ONLY for Zarfin's account
    const { data, error } = await supabase
      .from('email_accounts')
      .update({
        real_time_sync_active: true,
        webhook_active: false, // Keep webhooks off (they don't work in dev)
        sync_error: null,
        polling_interval: 2 // Check every 2 minutes
      })
      .eq('email', 'zarfin.jakupovic@withcar.si')
      .select();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully enabled sync for Zarfin!');
      console.log('\nAccount details:');
      console.log('  Email:', data[0].email);
      console.log('  Provider:', data[0].provider_type);
      console.log('  Sync Active:', data[0].real_time_sync_active);
      console.log('  Polling Interval:', data[0].polling_interval, 'minutes');
      console.log('\n📧 Zarfin\'s emails will now sync automatically!');
    } else {
      console.log('⚠️ No account found for zarfin.jakupovic@withcar.si');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

enableZarfinSync();