#!/usr/bin/env node

/**
 * Bulk Nutrition RBAC Verification Script
 * 
 * This script verifies the Role-Based Access Control (RBAC) policies for the Bulk Nutrition organization.
 * It tests various permission scenarios to ensure proper access control.
 * 
 * Usage:
 * 1. Create a .env file with AUTH_TOKEN and ORGANIZATION_ID
 * 2. Run: node verify-bulk-nutrition-rbac.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;
const ORGANIZATION_SLUG = process.env.ORGANIZATION_SLUG || 'bulk-nutrition';

// Validate environment
if (!AUTH_TOKEN) {
  console.error(chalk.red('❌ Error: AUTH_TOKEN is required in .env file'));
  process.exit(1);
}

if (!ORGANIZATION_ID && !ORGANIZATION_SLUG) {
  console.error(chalk.red('❌ Error: Either ORGANIZATION_ID or ORGANIZATION_SLUG is required in .env file'));
  process.exit(1);
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to add test result
function addTestResult(name, status, message = '') {
  const icons = {
    passed: chalk.green('✅'),
    failed: chalk.red('❌'),
    skipped: chalk.yellow('⏭️')
  };
  
  testResults.tests.push({ name, status, message });
  testResults[status]++;
  
  console.log(`${icons[status]} ${name}${message ? ': ' + message : ''}`);
}

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const response = await fetch(url, options);
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    
    return { response, data, status: response.status };
  } catch (error) {
    console.error(`API call error to ${url}:`, error);
    throw error;
  }
}

// Main execution function
async function main() {
  console.log(chalk.blue('🔒 Starting Bulk Nutrition RBAC verification'));
  
  try {
    // Step 1: Find organization ID if not provided
    let organizationId = ORGANIZATION_ID;
    
    if (!organizationId && ORGANIZATION_SLUG) {
      console.log(chalk.blue('\n🔍 Finding organization by slug'));
      const { data: listData, status } = await apiCall('/admin/organizations');
      
      if (status === 200) {
        const org = listData.organizations.find(org => org.slug === ORGANIZATION_SLUG);
        
        if (org) {
          organizationId = org.id;
          console.log(chalk.green(`✅ Found organization: ${org.name} (ID: ${organizationId})`));
        } else {
          console.log(chalk.red(`❌ Organization with slug '${ORGANIZATION_SLUG}' not found`));
          process.exit(1);
        }
      } else {
        addTestResult('Find organization', 'failed', `Status: ${status}`);
        process.exit(1);
      }
    }
    
    // Step 2: Verify organization access
    console.log(chalk.blue('\n🏢 Verifying organization access'));
    
    const { status: orgStatus } = await apiCall(`/admin/organizations/${organizationId}`);
    
    if (orgStatus === 200) {
      addTestResult('Access organization details', 'passed');
    } else {
      addTestResult('Access organization details', 'failed', `Status: ${orgStatus}`);
    }
    
    // Step 3: Verify role service functionality
    console.log(chalk.blue('\n👥 Verifying role service functionality'));
    
    // Get current user permissions
    const { data: permissionsData, status: permissionsStatus } = await apiCall('/auth/permissions');
    
    if (permissionsStatus === 200 && permissionsData.permissions) {
      addTestResult('Get user permissions', 'passed', `Found ${permissionsData.permissions.length} permissions`);
      
      // Check for admin permissions
      const hasAdminPermission = permissionsData.permissions.some(p => p.startsWith('admin.'));
      
      if (hasAdminPermission) {
        addTestResult('Admin permissions', 'passed', 'User has admin permissions');
      } else {
        addTestResult('Admin permissions', 'failed', 'User does not have admin permissions');
      }
    } else {
      addTestResult('Get user permissions', 'failed', `Status: ${permissionsStatus}`);
    }
    
    // Step 4: Test organization branding access
    console.log(chalk.blue('\n🎨 Testing organization branding access'));
    
    const { status: brandingStatus } = await apiCall(`/admin/organizations/${organizationId}/branding`);
    
    if (brandingStatus === 200) {
      addTestResult('Access organization branding', 'passed');
    } else {
      addTestResult('Access organization branding', 'failed', `Status: ${brandingStatus}`);
    }
    
    // Step 5: Test organization users access
    console.log(chalk.blue('\n👤 Testing organization users access'));
    
    const { status: usersStatus } = await apiCall(`/admin/organizations/${organizationId}/users`);
    
    if (usersStatus === 200) {
      addTestResult('Access organization users', 'passed');
    } else {
      addTestResult('Access organization users', 'failed', `Status: ${usersStatus}`);
    }
    
    // Step 6: Test organization subscription access
    console.log(chalk.blue('\n💳 Testing organization subscription access'));
    
    const { status: subscriptionStatus } = await apiCall(`/admin/organizations/${organizationId}/subscription`);
    
    if (subscriptionStatus === 200) {
      addTestResult('Access organization subscription', 'passed');
    } else {
      addTestResult('Access organization subscription', 'failed', `Status: ${subscriptionStatus}`);
    }
    
    // Step 7: Test feature flags access
    console.log(chalk.blue('\n🚩 Testing feature flags access'));
    
    const { status: featuresStatus } = await apiCall(`/admin/organizations/${organizationId}/features`);
    
    if (featuresStatus === 200) {
      addTestResult('Access feature flags', 'passed');
    } else {
      addTestResult('Access feature flags', 'failed', `Status: ${featuresStatus}`);
    }
    
    // Step 8: Test Metakocka integration access (if enabled)
    console.log(chalk.blue('\n🔄 Testing Metakocka integration access'));
    
    const { status: metakockaStatus } = await apiCall(`/integrations/metakocka/status`);
    
    if (metakockaStatus === 200) {
      addTestResult('Access Metakocka integration', 'passed');
    } else if (metakockaStatus === 403) {
      addTestResult('Access Metakocka integration', 'skipped', 'Integration not enabled or no permission');
    } else {
      addTestResult('Access Metakocka integration', 'failed', `Status: ${metakockaStatus}`);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Verification failed:'), error);
  }
  
  // Print test summary
  console.log(chalk.blue('\n📊 Test Summary:'));
  console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
  console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`⏭️ Skipped: ${testResults.skipped}`));
  
  // Recommendations based on test results
  console.log(chalk.blue('\n📋 Recommendations:'));
  
  if (testResults.failed > 0) {
    console.log(chalk.yellow('⚠️ Some tests failed. Check the following:'));
    console.log('1. Ensure your AUTH_TOKEN is valid and has admin permissions');
    console.log('2. Verify that the organization exists and is properly configured');
    console.log('3. Check that your user has the necessary roles assigned');
  } else {
    console.log(chalk.green('✅ All tests passed! RBAC policies are correctly configured.'));
    console.log('Next steps:');
    console.log('1. Create additional users with different roles to test more granular permissions');
    console.log('2. Set up custom roles if needed for specific access patterns');
    console.log('3. Configure Metakocka integration if required');
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
