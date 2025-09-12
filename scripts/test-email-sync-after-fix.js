#!/usr/bin/env node

/**
 * Test email sync after database constraints fix
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmailSyncAfterFix() {
  console.log('🧪 Testing email sync after database constraints fix...\n');

  // 1. Test database insert with all required fields
  const { data: zarfin } = await supabase
    .from('email_accounts')
    .select('id, user_id, email')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();

  if (!zarfin) {
    console.log('❌ Zarfin account not found');
    return;
  }

  console.log('✅ Found Zarfin account:', {
    id: zarfin.id,
    email: zarfin.email,
    user_id: zarfin.user_id
  });

  // Test 1: Direct database insert
  console.log('\n1. Testing direct database insert...');
  const testData = {
    message_id: 'test-after-fix-' + Date.now(),
    email_account_id: zarfin.id,
    user_id: zarfin.user_id,
    sender_email: 'test@example.com',
    email_type: 'received',
    folder_name: 'INBOX',
    subject: 'Test email after constraints fix',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error: insertError } = await supabase
    .from('email_index')
    .insert(testData);
    
  if (insertError) {
    console.log(`   ❌ Insert failed: ${insertError.message}`);
    return;
  } else {
    console.log('   ✅ Insert succeeded!');
  }

  // Test 2: Upsert with ON CONFLICT
  console.log('\n2. Testing upsert with ON CONFLICT...');
  const { error: upsertError } = await supabase
    .from('email_index')
    .upsert(testData, { onConflict: 'message_id' });
    
  if (upsertError) {
    console.log(`   ❌ Upsert failed: ${upsertError.message}`);
    console.log('   This is expected - let\'s try without onConflict...');
    
    // Try upsert without onConflict
    const { error: upsertError2 } = await supabase
      .from('email_index')
      .upsert(testData);
      
    if (upsertError2) {
      console.log(`   ❌ Upsert without onConflict failed: ${upsertError2.message}`);
      return;
    } else {
      console.log('   ✅ Upsert without onConflict succeeded!');
    }
  } else {
    console.log('   ✅ Upsert succeeded!');
  }

  // Test 3: Actual email sync API calls
  console.log('\n3. Testing actual email sync APIs...');
  
  const baseUrl = 'http://localhost:3002';
  
  // Test Microsoft Graph sync for Zarfin
  console.log('   Testing Microsoft Graph sync for Zarfin...');
  try {
    const response = await fetch(`${baseUrl}/api/emails/graph/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EmailSyncService/1.0'
      },
      body: JSON.stringify({
        email: zarfin.email,
        batchSize: 10 // Small batch for testing
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log(`   ✅ Microsoft sync succeeded: ${result.message}`);
    } else {
      console.log(`   ❌ Microsoft sync failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Microsoft sync error: ${error.message}`);
  }
  
  // Test Gmail sync
  console.log('   Testing Gmail sync...');
  try {
    const response = await fetch(`${baseUrl}/api/emails/gmail/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EmailSyncService/1.0'
      },
      body: JSON.stringify({
        email: 'timotejnekaj@gmail.com', // Test account
        batchSize: 10
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log(`   ✅ Gmail sync succeeded: ${result.message}`);
    } else {
      console.log(`   ❌ Gmail sync failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Gmail sync error: ${error.message}`);
  }

  // Clean up test data
  await supabase
    .from('email_index')
    .delete()
    .eq('message_id', testData.message_id);
  console.log('\n🧹 Test data cleaned up');
  
  console.log('\n✅ Email sync testing complete!');
}

testEmailSyncAfterFix().catch(console.error);