#!/usr/bin/env node

/**
 * Service Role Login Test
 * 
 * This script tests authentication with the Supabase service role key,
 * which has higher permissions than the anon key.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123';

// Verify environment
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Please ensure these environment variables are set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkUserAndAuth() {
  console.log('🔍 Checking test user with service role...');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log('');

  try {
    // First, check if the user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error listing users:', userError.message);
      return;
    }
    
    const testUser = users.users.find(user => user.email === TEST_EMAIL);
    
    if (!testUser) {
      console.error('❌ Test user not found in auth.users table');
      return;
    }
    
    console.log('✅ Test user found in auth.users table');
    console.log(`👤 User ID: ${testUser.id}`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔒 Email confirmed: ${testUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`📅 Created at: ${testUser.created_at}`);
    
    // Try to sign in as the user
    console.log('\n🔐 Attempting to sign in as test user...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (signInError) {
      console.error('❌ Sign-in failed:', signInError.message);
      
      // Try to reset the user's password
      console.log('\n🔄 Attempting to reset user password...');
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        { password: TEST_PASSWORD }
      );
      
      if (updateError) {
        console.error('❌ Password reset failed:', updateError.message);
      } else {
        console.log('✅ Password reset successful');
        console.log('🔄 Please try logging in again');
      }
      
      return;
    }
    
    console.log('✅ Sign-in successful!');
    console.log('');
    console.log('Session details:');
    console.log(`🔑 Session ID: ${signInData.session?.id || 'N/A'}`);
    console.log(`⏱️ Expires at: ${signInData.session?.expires_at ? new Date(signInData.session.expires_at * 1000).toLocaleString() : 'N/A'}`);
    
    // Check organization membership
    const { data: orgData, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', testUser.id);
    
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
      
      if (orgDetailsError) {
        console.error('❌ Error getting organization details:', orgDetailsError.message);
      } else if (org) {
        console.log(`📝 Name: ${org.name}`);
        console.log(`🔗 Slug: ${org.slug}`);
        console.log(`💼 Subscription tier: ${org.subscription_tier}`);
      }
    }
    
    // Check user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUser.id)
      .single();
    
    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('❌ Error checking user preferences:', prefsError.message);
    } else if (prefs) {
      console.log('');
      console.log('User preferences:');
      console.log(`🏢 Current organization: ${prefs.current_organization_id}`);
    } else {
      console.log('⚠️ No user preferences found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkUserAndAuth();








