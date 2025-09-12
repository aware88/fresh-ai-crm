#!/usr/bin/env node

/**
 * Check Test User with Service Role
 * 
 * This script checks the test user using the service role key,
 * which bypasses RLS policies.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = 'test@example.com';

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

async function checkTestUser() {
  console.log('🔍 Checking test user with service role...');
  console.log(`📧 Email: ${TEST_EMAIL}`);
  console.log('');

  try {
    // Check if user exists in auth.users
    console.log('🔄 Checking auth.users table...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error listing users:', userError.message);
      return;
    }
    
    const testUser = userData.users.find(user => user.email === TEST_EMAIL);
    
    if (!testUser) {
      console.error('❌ Test user not found in auth.users table');
      return;
    }
    
    console.log('✅ Test user found in auth.users table');
    console.log(`👤 User ID: ${testUser.id}`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔒 Email confirmed: ${testUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`🔒 Role: ${testUser.role}`);
    console.log(`🔒 App metadata: ${JSON.stringify(testUser.app_metadata)}`);
    console.log(`📅 Created at: ${testUser.created_at}`);
    
    // Check organizations table
    console.log('\n🔄 Checking organizations table...');
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgsError) {
      console.error('❌ Error querying organizations:', orgsError.message);
    } else {
      console.log(`✅ Found ${orgsData.length} organizations`);
      
      // Find Test Organization
      const testOrg = orgsData.find(org => org.name === 'Test Organization');
      
      if (testOrg) {
        console.log('✅ Test Organization found:');
        console.log(`🏢 ID: ${testOrg.id}`);
        console.log(`📝 Name: ${testOrg.name}`);
        console.log(`🔗 Slug: ${testOrg.slug}`);
        console.log(`💼 Subscription tier: ${testOrg.subscription_tier}`);
      } else {
        console.error('❌ Test Organization not found');
      }
    }
    
    // Check organization memberships
    console.log('\n🔄 Checking organization_members table...');
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('*');
    
    if (membersError) {
      console.error('❌ Error querying organization_members:', membersError.message);
    } else {
      console.log(`✅ Found ${membersData.length} organization memberships`);
      
      // Find test user's membership
      const testUserMembership = membersData.find(member => member.user_id === testUser.id);
      
      if (testUserMembership) {
        console.log('✅ Test user is a member of an organization:');
        console.log(`🏢 Organization ID: ${testUserMembership.organization_id}`);
        console.log(`👑 Role: ${testUserMembership.role}`);
      } else {
        console.error('❌ Test user is not a member of any organization');
      }
    }
    
    // Check user preferences
    console.log('\n🔄 Checking user_preferences table...');
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*');
    
    if (prefsError) {
      console.error('❌ Error querying user_preferences:', prefsError.message);
    } else {
      console.log(`✅ Found ${prefsData.length} user preferences`);
      
      // Find test user's preferences
      const testUserPrefs = prefsData.find(pref => pref.user_id === testUser.id);
      
      if (testUserPrefs) {
        console.log('✅ Test user has preferences:');
        console.log(`🏢 Current organization: ${testUserPrefs.current_organization_id}`);
      } else {
        console.error('❌ Test user has no preferences');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkTestUser();








