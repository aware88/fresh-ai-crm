#!/usr/bin/env node

/**
 * Direct Supabase Login Script
 * 
 * This script bypasses NextAuth and logs in directly with Supabase.
 * It helps verify that the user credentials are working correctly.
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

async function directLogin() {
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
      console.error('1. Run the minimal-user-setup.sql script in Supabase SQL Editor');
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
    console.log(`🔓 Access token: ${data.session?.access_token.substring(0, 10)}...`);
    
    // Get user's organization
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
      
      // Get organization details
      const { data: org, error: orgDetailsError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgData[0].organization_id)
        .single();
      
      if (!orgDetailsError && org) {
        console.log(`📝 Name: ${org.name}`);
        console.log(`🔗 Slug: ${org.slug}`);
        console.log(`💼 Subscription tier: ${org.subscription_tier}`);
      }
    }
    
    console.log('');
    console.log('🔍 NextAuth Issue Diagnosis:');
    console.log('Direct Supabase login works, but NextAuth login fails. This suggests:');
    console.log('1. The NextAuth adapter is misconfigured');
    console.log('2. There might be missing NextAuth schema tables');
    console.log('3. The NextAuth session handling is broken');
    
    console.log('');
    console.log('💡 Workaround Options:');
    console.log('1. Modify your app to use direct Supabase authentication instead of NextAuth');
    console.log('2. Fix the NextAuth configuration (check for missing tables or permissions)');
    console.log('3. Use the Supabase session in your browser for testing');
    
  } catch (error) {
    console.error('❌ Unexpected error during authentication:');
    console.error(error);
  }
}

// Run the direct login test
directLogin();








