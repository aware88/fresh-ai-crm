#!/usr/bin/env node

/**
 * Test insert with all required fields
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteInsert() {
  console.log('🧪 Testing insert with all required fields...\n');

  // Get Zarfin's account
  const { data: zarfin } = await supabase
    .from('email_accounts')
    .select('id, user_id')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();

  if (!zarfin) {
    console.log('❌ Zarfin account not found');
    return;
  }

  // Test with all required fields based on the error message
  const completeData = {
    message_id: 'test-complete-' + Date.now(),
    email_account_id: zarfin.id,
    user_id: zarfin.user_id,
    sender_email: 'test@example.com',  // This was missing!
    email_type: 'received',
    folder_name: 'INBOX',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('1. Testing insert with all required fields...');
  const { error: insertError } = await supabase
    .from('email_index')
    .insert(completeData);
    
  if (insertError) {
    console.log(`   ❌ Insert failed: ${insertError.message}`);
    console.log('   Error code:', insertError.code);
    console.log('   Full error:', insertError);
  } else {
    console.log('   ✅ Insert succeeded!');
    
    // Clean up
    await supabase
      .from('email_index')
      .delete()
      .eq('message_id', completeData.message_id);
    console.log('   🧹 Test data cleaned up');
  }
  
  // Now test upsert with the same data
  console.log('\n2. Testing upsert with the same complete data...');
  completeData.message_id = 'test-upsert-' + Date.now();
  
  const { error: upsertError } = await supabase
    .from('email_index')
    .upsert(completeData);
    
  if (upsertError) {
    console.log(`   ❌ Upsert failed: ${upsertError.message}`);
    console.log('   Error code:', upsertError.code);
  } else {
    console.log('   ✅ Upsert succeeded!');
    
    // Clean up
    await supabase
      .from('email_index')
      .delete()
      .eq('message_id', completeData.message_id);
    console.log('   🧹 Test data cleaned up');
  }
}

testCompleteInsert().catch(console.error);
