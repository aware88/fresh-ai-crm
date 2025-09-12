#!/usr/bin/env node

/**
 * Create New Test User
 * 
 * This script creates a completely new test user with a different email
 * using the Supabase JavaScript client.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NEW_TEST_EMAIL = 'test2@example.com';
const NEW_TEST_PASSWORD = 'Test123Password!';

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

async function createNewTestUser() {
  console.log('🔍 Creating new test user...');
  console.log(`📧 Email: ${NEW_TEST_EMAIL}`);
  console.log(`🔑 Password: ${NEW_TEST_PASSWORD}`);
  console.log('');

  try {
    // Create new user
    console.log('🔄 Signing up new user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: NEW_TEST_EMAIL,
      password: NEW_TEST_PASSWORD,
      options: {
        data: {
          first_name: 'New',
          last_name: 'Test',
          full_name: 'New Test User'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Sign-up failed:', signUpError.message);
      return;
    }
    
    console.log('✅ User created successfully!');
    console.log(`👤 User ID: ${signUpData.user.id}`);
    console.log(`📧 Email: ${signUpData.user.email}`);
    
    // Sign in with the new user
    console.log('\n🔄 Signing in with new user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: NEW_TEST_EMAIL,
      password: NEW_TEST_PASSWORD
    });
    
    if (signInError) {
      console.error('❌ Sign-in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Sign-in successful!');
    console.log(`🔑 Session ID: ${signInData.session.id}`);
    
    // Create a new organization
    console.log('\n🔄 Creating new test organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'New Test Organization',
        slug: 'new-test-org',
        subscription_tier: 'pro',
        created_by: signInData.user.id
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('❌ Organization creation failed:', orgError.message);
    } else {
      console.log('✅ Organization created successfully!');
      console.log(`🏢 Organization ID: ${orgData.id}`);
      console.log(`📝 Name: ${orgData.name}`);
      
      // Add user as organization member
      console.log('\n🔄 Adding user to organization...');
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: signInData.user.id,
          role: 'owner'
        })
        .select()
        .single();
      
      if (memberError) {
        console.error('❌ Adding user to organization failed:', memberError.message);
      } else {
        console.log('✅ User added to organization successfully!');
        
        // Create user preferences
        console.log('\n🔄 Creating user preferences...');
        const { data: prefsData, error: prefsError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: signInData.user.id,
            current_organization_id: orgData.id
          })
          .select()
          .single();
        
        if (prefsError) {
          console.error('❌ Creating user preferences failed:', prefsError.message);
        } else {
          console.log('✅ User preferences created successfully!');
        }
      }
    }
    
    console.log('\n🎉 NEW TEST USER SETUP COMPLETED');
    console.log('📧 Email: ' + NEW_TEST_EMAIL);
    console.log('🔑 Password: ' + NEW_TEST_PASSWORD);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createNewTestUser();
