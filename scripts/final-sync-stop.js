/**
 * Final cleanup: Ensure ALL accounts have real-time sync disabled
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function finalSyncStop() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Force disable real-time sync for ALL accounts
  const { error } = await supabase
    .from('email_accounts')
    .update({
      real_time_sync_active: false
    })
    .eq('is_active', true);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('✅ Final cleanup: All accounts now have real_time_sync_active = false');
}

finalSyncStop();