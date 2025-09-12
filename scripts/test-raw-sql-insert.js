#!/usr/bin/env node

/**
 * Test raw SQL insert to bypass Supabase client
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRawSQL() {
  console.log('🧪 Testing raw SQL insert...\n');

  // First, get Zarfin's account
  const { data: zarfin } = await supabase
    .from('email_accounts')
    .select('id, user_id')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();

  if (!zarfin) {
    console.log('❌ Zarfin account not found');
    return;
  }

  console.log('Found Zarfin account:', zarfin.id);

  // Try raw SQL insert
  const messageId = 'test-raw-sql-' + Date.now();
  
  const sqlQuery = `
    INSERT INTO email_index (
      message_id,
      email_account_id,
      user_id,
      subject,
      sender_email,
      email_type,
      folder_name,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    )
    ON CONFLICT (message_id) DO NOTHING
    RETURNING *;
  `;

  console.log('\n1. Testing raw SQL with ON CONFLICT (message_id) DO NOTHING...');
  
  try {
    // Note: Supabase doesn't have a direct raw SQL method, 
    // so we need to use RPC or create a function
    console.log('   Supabase client doesn\'t support raw SQL directly.');
    console.log('   Let\'s create a database function to handle this...\n');
    
    // Try creating a simple insert function
    const insertFunction = `
      CREATE OR REPLACE FUNCTION insert_email_index_safe(
        p_message_id TEXT,
        p_account_id UUID,
        p_user_id UUID,
        p_subject TEXT,
        p_sender TEXT
      ) RETURNS VOID AS $$
      BEGIN
        INSERT INTO email_index (
          message_id,
          email_account_id,
          user_id,
          subject,
          sender_email,
          email_type,
          folder_name,
          created_at,
          updated_at
        ) VALUES (
          p_message_id,
          p_account_id,
          p_user_id,
          p_subject,
          p_sender,
          'received',
          'INBOX',
          NOW(),
          NOW()
        ) ON CONFLICT (message_id) DO NOTHING;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('2. Let\'s try a different approach - check what columns have unique constraints...\n');
    
    // Try to understand the table structure better
    const { data: sample, error: sampleError } = await supabase
      .from('email_index')
      .select('*')
      .limit(1);
      
    if (!sampleError && sample && sample.length > 0) {
      console.log('Sample record columns:', Object.keys(sample[0]));
      console.log('\n');
    }
    
    // Try inserting with minimum required fields
    console.log('3. Testing insert with minimum required fields...');
    const minimalData = {
      message_id: 'test-minimal-' + Date.now(),
      email_account_id: zarfin.id,
      user_id: zarfin.user_id
    };
    
    const { error: minimalError } = await supabase
      .from('email_index')
      .insert(minimalData);
      
    if (minimalError) {
      console.log(`   ❌ Minimal insert failed: ${minimalError.message}`);
      console.log('   Error code:', minimalError.code);
      console.log('   Error details:', minimalError.details);
      console.log('   Error hint:', minimalError.hint);
    } else {
      console.log('   ✅ Minimal insert succeeded!');
      
      // Clean up
      await supabase
        .from('email_index')
        .delete()
        .eq('message_id', minimalData.message_id);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRawSQL().catch(console.error);
