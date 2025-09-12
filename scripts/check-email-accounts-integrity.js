#!/usr/bin/env node

/**
 * Check email accounts integrity
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIntegrity() {
  console.log('🔍 Checking email accounts integrity...\n');

  // Get all email accounts
  const { data: accounts, error } = await supabase
    .from('email_accounts')
    .select('id, email, provider_type, user_id, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching accounts:', error);
    return;
  }

  console.log(`📧 Found ${accounts?.length || 0} email accounts:\n`);
  
  accounts?.forEach(account => {
    console.log(`  ${account.is_active ? '✅' : '❌'} ${account.email}`);
    console.log(`     ID: ${account.id}`);
    console.log(`     Provider: ${account.provider_type}`);
    console.log(`     User ID: ${account.user_id}`);
    console.log(`     Created: ${account.created_at}`);
    console.log('');
  });

  // Check for orphaned email_index records
  console.log('🔍 Checking for orphaned email_index records...\n');
  
  const { data: orphaned, error: orphanError } = await supabase
    .from('email_index')
    .select('message_id, email_account_id')
    .limit(5);

  if (!orphanError && orphaned) {
    console.log(`Found ${orphaned.length} email_index records (showing first 5)`);
    
    for (const record of orphaned) {
      // Check if account exists
      const { data: accountExists } = await supabase
        .from('email_accounts')
        .select('id, email')
        .eq('id', record.email_account_id)
        .single();
        
      if (!accountExists) {
        console.log(`  ❌ Orphaned: ${record.message_id} -> account ${record.email_account_id} doesn't exist!`);
      } else {
        console.log(`  ✅ Valid: ${record.message_id} -> ${accountExists.email}`);
      }
    }
  }
  
  // Check Zarfin's specific account
  console.log('\n🔍 Checking Zarfin\'s account specifically...\n');
  
  const { data: zarfin } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();
    
  if (zarfin) {
    console.log('Zarfin account details:');
    console.log(JSON.stringify(zarfin, null, 2));
    
    // Check if this ID can be used in email_index
    console.log('\n🧪 Testing if we can insert with Zarfin\'s account ID...');
    
    const testData = {
      message_id: 'test-zarfin-' + Date.now(),
      email_account_id: zarfin.id,
      user_id: zarfin.user_id,
      subject: 'Test',
      sender_email: 'test@example.com',
      email_type: 'received',
      folder_name: 'INBOX',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: testError } = await supabase
      .from('email_index')
      .insert(testData);
      
    if (testError) {
      console.log(`❌ Cannot insert: ${testError.message}`);
      console.log('Full error:', testError);
    } else {
      console.log('✅ Test insert succeeded!');
      
      // Clean up
      await supabase
        .from('email_index')
        .delete()
        .eq('message_id', testData.message_id);
    }
  } else {
    console.log('❌ Zarfin account not found!');
  }
}

checkIntegrity().catch(console.error);
