#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testServiceRoleInsert() {
  console.log('🧪 Testing service role insert...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: zarfin } = await supabase
    .from('email_accounts')
    .select('id, user_id, email')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();

  console.log('Found account:', zarfin);

  const testData = {
    message_id: 'service-role-test-' + Date.now(),
    email_account_id: zarfin.id,
    user_id: zarfin.user_id,
    sender_email: 'test@example.com',
    email_type: 'received',
    folder_name: 'INBOX',
    subject: 'Service role test'
  };
  
  console.log('Attempting insert with service role client...');
  
  const { data, error } = await supabase
    .from('email_index')
    .insert(testData)
    .select();
    
  if (error) {
    console.log('❌ Service role insert error:', error);
  } else {
    console.log('✅ Service role insert success:', data);
    
    // Clean up
    await supabase
      .from('email_index')
      .delete()
      .eq('message_id', testData.message_id);
    console.log('🧹 Cleaned up');
  }
}

testServiceRoleInsert().catch(console.error);