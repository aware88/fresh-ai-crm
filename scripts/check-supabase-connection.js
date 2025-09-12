#!/usr/bin/env node

/**
 * Check Supabase Connection
 * 
 * This script tests the basic connection to Supabase
 * without trying to authenticate or access protected resources.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify environment
if (!SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

console.log('🔍 Checking Supabase connection...');
console.log(`🌐 URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'Not set'}`);
console.log(`🔑 Service Role Key: ${SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'Not set'}`);
console.log('');

async function checkConnection() {
  try {
    // Test with anon key
    if (SUPABASE_ANON_KEY) {
      console.log('🔄 Testing connection with anon key...');
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      try {
        const { data, error } = await anonClient.from('organizations').select('id');
        
        if (error) {
          console.error('❌ Anon key test failed:', error.message);
        } else {
          console.log('✅ Anon key connection successful!');
          console.log(`📊 Found ${data?.length || 0} organizations`);
        }
      } catch (error) {
        console.error('❌ Anon key test exception:', error.message);
      }
    }
    
    // Test with service role key
    if (SERVICE_ROLE_KEY) {
      console.log('\n🔄 Testing connection with service role key...');
      const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      
      try {
        const { data, error } = await serviceClient.from('organizations').select('id');
        
        if (error) {
          console.error('❌ Service role key test failed:', error.message);
        } else {
          console.log('✅ Service role key connection successful!');
          console.log(`📊 Found ${data?.length || 0} organizations`);
        }
      } catch (error) {
        console.error('❌ Service role key test exception:', error.message);
      }
    }
    
    // Test auth status
    if (SUPABASE_ANON_KEY) {
      console.log('\n🔄 Testing auth status...');
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      try {
        const { data, error } = await anonClient.auth.getSession();
        
        if (error) {
          console.error('❌ Auth status test failed:', error.message);
        } else {
          console.log('✅ Auth status check successful');
          console.log(`👤 User: ${data.session?.user?.email || 'Not logged in'}`);
        }
      } catch (error) {
        console.error('❌ Auth status test exception:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkConnection();
