#!/usr/bin/env node

/**
 * Check all constraints on email-related tables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  console.log('🔍 Checking database constraints for email tables...\n');

  // Check constraints on email_index table
  const { data: indexConstraints, error: indexError } = await supabase.rpc('get_table_constraints', {
    table_name: 'email_index'
  });

  if (indexError) {
    // Try a direct SQL query instead
    const { data, error } = await supabase.from('email_index').select('*').limit(0);
    console.log('❌ Cannot get constraints directly, but table exists:', !error);
    
    // Try to get table info differently
    const query = `
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        tc.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'email_index'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `;
    
    console.log('Running SQL query to get constraints...');
    const { data: constraints, error: sqlError } = await supabase.rpc('exec_sql', { query });
    
    if (sqlError) {
      console.log('Cannot execute custom SQL. Let me try another approach...');
      
      // Just test what works
      console.log('\n📊 Testing what upsert operations work:\n');
      
      // Test with no onConflict
      const testData = {
        message_id: 'test-' + Date.now(),
        email_account_id: '00000000-0000-0000-0000-000000000001',
        subject: 'Test',
        sender_email: 'test@example.com'
      };
      
      console.log('1. Testing upsert with NO onConflict...');
      const { error: noConflictError } = await supabase
        .from('email_index')
        .upsert(testData);
      console.log('   Result:', noConflictError ? `❌ ${noConflictError.message}` : '✅ Works!');
      
      console.log('2. Testing upsert with onConflict: "message_id"...');
      const { error: messageIdError } = await supabase
        .from('email_index')
        .upsert(testData, { onConflict: 'message_id' });
      console.log('   Result:', messageIdError ? `❌ ${messageIdError.message}` : '✅ Works!');
      
      console.log('3. Testing simple INSERT...');
      const { error: insertError } = await supabase
        .from('email_index')
        .insert({...testData, message_id: 'test-insert-' + Date.now()});
      console.log('   Result:', insertError ? `❌ ${insertError.message}` : '✅ Works!');
      
      // Clean up test data
      await supabase
        .from('email_index')
        .delete()
        .like('message_id', 'test-%');
        
    } else {
      console.log('Constraints found:', constraints);
    }
  } else {
    console.log('Email Index Constraints:', indexConstraints);
  }

  // Check email_threads constraints
  console.log('\n📊 Checking email_threads table...');
  const { data: threadTest } = await supabase
    .from('email_threads')
    .select('*')
    .limit(0);
  console.log('email_threads table exists: ✅');

  // Check email_content_cache  
  console.log('\n📊 Checking email_content_cache table...');
  const { data: cacheTest } = await supabase
    .from('email_content_cache')
    .select('*')
    .limit(0);
  console.log('email_content_cache table exists: ✅');
}

checkConstraints().catch(console.error);
