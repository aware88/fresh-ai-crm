#!/usr/bin/env node

/**
 * Test Direct Login Script
 * 
 * This script tests direct authentication with Supabase,
 * bypassing NextAuth to verify the user credentials work.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123';

// Verify environment
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Please ensure these environment variables are set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('🔐 Testing direct Supabase authentication...');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log(`🔑 Password: ${TEST_PASSWORD}`);
  console.log('');

  try {
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (error) {
      console.error('❌ Authentication failed!');
      console.error(`Error: ${error.message}`);
      console.error('');
      console.error('Possible solutions:');
      console.error('1. Run the direct-login-fix.sql script in Supabase SQL Editor');
      console.error('2. Verify the user exists in auth.users table');
      console.error('3. Check that email_confirmed_at is set to a timestamp');
      return;
    }

    // Success!
    console.log('✅ Authentication successful!');
    console.log('');
    console.log('User details:');
    console.log(`👤 User ID: ${data.user.id}`);
    console.log(`📧 Email: ${data.user.email}`);
    console.log(`🔒 Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`📅 Created at: ${data.user.created_at}`);
    console.log('');
    console.log('Session details:');
    console.log(`🔑 Session ID: ${data.session?.id || 'N/A'}`);
    console.log(`⏱️ Expires at: ${data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A'}`);
    
    // Check if user is in an organization
    const { data: orgData, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', data.user.id);
    
    if (orgError) {
      console.error('❌ Error checking organization membership:', orgError.message);
    } else if (!orgData || orgData.length === 0) {
      console.log('⚠️ User is not a member of any organization!');
    } else {
      console.log('');
      console.log('Organization details:');
      console.log(`🏢 Organization ID: ${orgData[0].organization_id}`);
      console.log(`👑 Role: ${orgData[0].role}`);
    }

    console.log('');
    console.log('🔍 NextAuth Issue Diagnosis:');
    console.log('If direct Supabase login works but NextAuth login fails, the issue is likely with:');
    console.log('1. NextAuth adapter configuration');
    console.log('2. Missing NextAuth schema tables');
    console.log('3. Mismatch between NextAuth and Supabase user data');
    
  } catch (error) {
    console.error('❌ Unexpected error during authentication:');
    console.error(error);
  }
}

// Run the test
testLogin();








