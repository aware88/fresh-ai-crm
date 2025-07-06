/**
 * Organization Setup Test Script
 * 
 * This script tests the complete organization setup flow:
 * 1. User creation
 * 2. Organization creation
 * 3. Role assignment
 * 4. Permission validation
 * 
 * Run with: node organization-setup-test.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import crypto from 'crypto';

config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Generate unique test data
const timestamp = Date.now();
const randomString = crypto.randomBytes(4).toString('hex');
const TEST_EMAIL = `test-user-${randomString}@example.com`;
const TEST_PASSWORD = 'Test@123456';
const TEST_FIRST_NAME = 'Test';
const TEST_LAST_NAME = 'User';
const TEST_ORG_NAME = `Test Organization ${randomString}`;
const TEST_ORG_SLUG = `test-org-${randomString}`;
const TEST_SUBSCRIPTION_PLAN = 'starter';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results tracking
const testResults = {
  userCreation: false,
  organizationCreation: false,
  adminRoleAssignment: false,
  ownerRoleAssignment: false,
  permissionValidation: false
};

// Helper function to log test results
function logTestResult(testName, success, details = null) {
  console.log(`[${success ? 'PASS' : 'FAIL'}] ${testName}`);
  if (details) {
    console.log(`  Details: ${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`);
  }
  testResults[testName] = success;
}

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Organization Setup Tests');
  console.log('=================================');
  console.log(`Test email: ${TEST_EMAIL}`);
  console.log(`Test organization: ${TEST_ORG_NAME} (${TEST_ORG_SLUG})`);
  console.log('=================================\n');

  try {
    // Step 1: Create a test user
    console.log('Step 1: Creating test user...');
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          first_name: TEST_FIRST_NAME,
          last_name: TEST_LAST_NAME,
          full_name: `${TEST_FIRST_NAME} ${TEST_LAST_NAME}`
        }
      }
    });

    if (userError) {
      throw new Error(`User creation failed: ${userError.message}`);
    }

    const userId = userData.user.id;
    logTestResult('userCreation', true, { userId });
    console.log(`User created with ID: ${userId}`);

    // Step 2: Sign in to get access token
    console.log('\nStep 2: Signing in to get access token...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (sessionError) {
      throw new Error(`Sign in failed: ${sessionError.message}`);
    }

    const accessToken = sessionData.session.access_token;
    console.log('Successfully signed in and obtained access token');

    // Step 3: Create organization
    console.log('\nStep 3: Creating organization...');
    const orgResponse = await fetch(`${API_BASE_URL}/admin/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: TEST_ORG_NAME,
        slug: TEST_ORG_SLUG,
        admin_user_id: userId,
        subscription_plan: TEST_SUBSCRIPTION_PLAN
      })
    });

    const orgData = await orgResponse.json();
    
    if (!orgResponse.ok) {
      throw new Error(`Organization creation failed: ${JSON.stringify(orgData)}`);
    }

    const organizationId = orgData.organization.id;
    logTestResult('organizationCreation', true, { organizationId });
    console.log(`Organization created with ID: ${organizationId}`);

    // Wait a moment for roles to be assigned
    await delay(2000);

    // Step 4: Verify admin role assignment
    console.log('\nStep 4: Verifying admin role assignment...');
    const { data: adminRoleData, error: adminRoleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .join('roles', { foreignTable: 'roles', on: 'roles.id=user_roles.role_id' })
      .eq('roles.name', 'admin');

    if (adminRoleError) {
      throw new Error(`Admin role verification failed: ${adminRoleError.message}`);
    }

    const hasAdminRole = adminRoleData && adminRoleData.length > 0;
    logTestResult('adminRoleAssignment', hasAdminRole, { roleData: adminRoleData });
    
    // Step 5: Verify owner role assignment
    console.log('\nStep 5: Verifying owner role assignment...');
    const { data: ownerRoleData, error: ownerRoleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .join('roles', { foreignTable: 'roles', on: 'roles.id=user_roles.role_id' })
      .eq('roles.name', 'owner');

    if (ownerRoleError) {
      throw new Error(`Owner role verification failed: ${ownerRoleError.message}`);
    }

    const hasOwnerRole = ownerRoleData && ownerRoleData.length > 0;
    logTestResult('ownerRoleAssignment', hasOwnerRole, { roleData: ownerRoleData });

    // Step 6: Verify permissions
    console.log('\nStep 6: Verifying user permissions...');
    const permissionsResponse = await fetch(`${API_BASE_URL}/users/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const permissionsData = await permissionsResponse.json();
    
    if (!permissionsResponse.ok) {
      throw new Error(`Permissions verification failed: ${JSON.stringify(permissionsData)}`);
    }

    // Check if user has admin permissions
    const hasAdminPermissions = permissionsData.permissions && 
      permissionsData.permissions.some(p => p.includes('admin.'));
    
    logTestResult('permissionValidation', hasAdminPermissions, { permissions: permissionsData.permissions });

    // Step 7: Verify subscription plan
    console.log('\nStep 7: Verifying subscription plan...');
    const { data: subscriptionData, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_tier, subscription_status')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      throw new Error(`Organization data fetch failed: ${orgError.message}`);
    }

    const hasCorrectSubscription = subscriptionData.subscription_tier === TEST_SUBSCRIPTION_PLAN && 
      subscriptionData.subscription_status === 'active';
    
    logTestResult('subscriptionSetup', hasCorrectSubscription, { 
      tier: subscriptionData.subscription_tier,
      status: subscriptionData.subscription_status
    });

    // Final summary
    console.log('\n=================================');
    console.log('Test Summary:');
    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(`${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    });
    console.log('=================================');

    const allTestsPassed = Object.values(testResults).every(result => result === true);
    console.log(`\nOverall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    // Clean up (optional - comment out if you want to keep the test data)
    // await cleanupTestData(userId, organizationId, accessToken);

  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Clean up test data (optional)
 */
async function cleanupTestData(userId, organizationId, accessToken) {
  console.log('\nCleaning up test data...');
  
  try {
    // Delete organization
    if (organizationId) {
      const deleteOrgResponse = await fetch(`${API_BASE_URL}/admin/organizations/${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (deleteOrgResponse.ok) {
        console.log(`Organization ${organizationId} deleted successfully`);
      } else {
        console.log(`Failed to delete organization ${organizationId}`);
      }
    }
    
    // Delete user (if needed)
    // Note: In many cases, the organization deletion will cascade to user roles
    // but the actual user in auth.users might need separate handling
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
}

// Run the tests
runTests();
