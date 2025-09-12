#!/usr/bin/env node

/**
 * Test the exact AI cache query to see why it's failing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testAICacheQuery() {
  const emailId = 'AAMkAGQyYTlmNzNiLWJlMzMtNGIxMy04ZDc4LTM1NTMzOTU0OTAzOQBGAAAAAACA2cA14uuRR56XFaoM8tObBwBnw1LxIWESTpoE9YcUqWS_AAAAAAEMAABnw1LxIWESTpoE9YcUqWS_AATRs9F5AAA=';
  const userId = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';

  console.log('🔍 Testing AI Cache Query...');
  console.log(`📧 Email ID: ${emailId.substring(0, 50)}...`);
  console.log(`👤 User ID: ${userId}`);

  // Test 1: Service role query (same as our fix script)
  console.log('\n🔧 Test 1: Service role client');
  const { data: serviceEmails, error: serviceError } = await serviceClient
    .from('email_index')
    .select('id, user_id, message_id, email_account_id')
    .eq('message_id', emailId)
    .eq('user_id', userId);

  if (serviceError) {
    console.log('❌ Service role error:', serviceError);
  } else {
    console.log(`✅ Service role found: ${serviceEmails?.length || 0} emails`);
    if (serviceEmails?.length > 0) {
      console.log('📧 Email details:', serviceEmails[0]);
    }
  }

  // Test 2: Anonymous client (similar to route handler)
  console.log('\n🌐 Test 2: Anonymous client');
  const { data: anonEmails, error: anonError } = await anonClient
    .from('email_index')
    .select('id, user_id, message_id, email_account_id')
    .eq('message_id', emailId)
    .eq('user_id', userId);

  if (anonError) {
    console.log('❌ Anonymous error:', anonError);
  } else {
    console.log(`✅ Anonymous found: ${anonEmails?.length || 0} emails`);
    if (anonEmails?.length > 0) {
      console.log('📧 Email details:', anonEmails[0]);
    }
  }

  // Test 3: Without user_id filter (fallback query)
  console.log('\n🔄 Test 3: Fallback query (no user filter)');
  const { data: fallbackEmails, error: fallbackError } = await serviceClient
    .from('email_index')
    .select('id, user_id, message_id, email_account_id')
    .eq('message_id', emailId)
    .limit(1);

  if (fallbackError) {
    console.log('❌ Fallback error:', fallbackError);
  } else {
    console.log(`✅ Fallback found: ${fallbackEmails?.length || 0} emails`);
    if (fallbackEmails?.length > 0) {
      console.log('📧 Email details:', fallbackEmails[0]);
    }
  }

  // Test 4: Check RLS policies
  console.log('\n🔒 Test 4: Check RLS status');
  const { data: rlsInfo } = await serviceClient
    .rpc('pg_get_object_address', { 
      type: 'table', 
      name: ['public', 'email_index']
    })
    .single();

  console.log('📋 RLS info:', rlsInfo);
}

testAICacheQuery().catch(console.error);