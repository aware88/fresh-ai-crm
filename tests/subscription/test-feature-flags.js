/**
 * Feature Flag Management Test Script
 * 
 * This script tests the feature flag management functionality, including:
 * - Checking feature access
 * - Overriding feature flags
 * - Verifying override effects
 */

require('dotenv').config();
// In Node.js v18+, fetch is available globally, but for older versions we need to use node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;
const FEATURE_NAME = process.env.FEATURE_NAME || 'metakocka_integration';

// Validation
if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN is required');
  process.exit(1);
}

if (!ORGANIZATION_ID) {
  console.error('❌ ORGANIZATION_ID is required');
  process.exit(1);
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { response, data };
    } else {
      const text = await response.text();
      return { response, text };
    }
  } catch (error) {
    console.error(`Error making request to ${url}:`, error);
    throw error;
  }
}

// Test function
async function runTest(name, testFn) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Feature Flag Management Tests');
  console.log('===========================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Organization ID: ${ORGANIZATION_ID}`);
  console.log(`Test Feature: ${FEATURE_NAME}`);
  console.log('===========================================\n');

  // Test 1: Check initial feature access
  await runTest('Check initial feature access', async () => {
    const { response, data } = await apiRequest(
      `/organizations/${ORGANIZATION_ID}/subscription/features/${FEATURE_NAME}`
    );

    if (!response.ok) {
      throw new Error(`Failed to check feature access: ${data.error || response.statusText}`);
    }

    console.log(`   Initial access to ${FEATURE_NAME}: ${data.hasAccess ? 'Enabled' : 'Disabled'}`);
    // Store the initial state for later comparison
    global.initialAccess = data.hasAccess;
  });

  // Test 2: Override feature flag (toggle from current state)
  await runTest('Override feature flag', async () => {
    const newAccessValue = !global.initialAccess;
    
    const overrides = {};
    overrides[FEATURE_NAME] = newAccessValue;
    
    const { response, data } = await apiRequest(
      `/organizations/${ORGANIZATION_ID}/subscription/features/override`,
      {
        method: 'POST',
        body: JSON.stringify({ overrides })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to override feature flag: ${data.error || response.statusText}`);
    }

    console.log(`   Feature ${FEATURE_NAME} override set to: ${newAccessValue ? 'Enabled' : 'Disabled'}`);
  });

  // Test 3: Verify feature access after override
  await runTest('Verify feature access after override', async () => {
    // Wait a moment to ensure the override has been processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { response, data } = await apiRequest(
      `/organizations/${ORGANIZATION_ID}/subscription/features/${FEATURE_NAME}`
    );

    if (!response.ok) {
      throw new Error(`Failed to check feature access: ${data.error || response.statusText}`);
    }

    const expectedAccess = !global.initialAccess;
    if (data.hasAccess !== expectedAccess) {
      throw new Error(`Feature access did not change as expected. Expected: ${expectedAccess}, Got: ${data.hasAccess}`);
    }

    console.log(`   Current access to ${FEATURE_NAME}: ${data.hasAccess ? 'Enabled' : 'Disabled'}`);
  });

  // Test 4: Reset feature flag override
  await runTest('Reset feature flag override', async () => {
    const overrides = {};
    overrides[FEATURE_NAME] = global.initialAccess;
    
    const { response, data } = await apiRequest(
      `/organizations/${ORGANIZATION_ID}/subscription/features/override`,
      {
        method: 'POST',
        body: JSON.stringify({ overrides })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to reset feature flag: ${data.error || response.statusText}`);
    }

    console.log(`   Feature ${FEATURE_NAME} reset to original state: ${global.initialAccess ? 'Enabled' : 'Disabled'}`);
  });

  // Test 5: Verify feature access after reset
  await runTest('Verify feature access after reset', async () => {
    // Wait a moment to ensure the override has been processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { response, data } = await apiRequest(
      `/organizations/${ORGANIZATION_ID}/subscription/features/${FEATURE_NAME}`
    );

    if (!response.ok) {
      throw new Error(`Failed to check feature access: ${data.error || response.statusText}`);
    }

    if (data.hasAccess !== global.initialAccess) {
      throw new Error(`Feature access was not reset correctly. Expected: ${global.initialAccess}, Got: ${data.hasAccess}`);
    }

    console.log(`   Current access to ${FEATURE_NAME}: ${data.hasAccess ? 'Enabled' : 'Disabled'}`);
  });

  // Print test summary
  console.log('\n===========================================');
  console.log('🏁 Test Summary');
  console.log('===========================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log('===========================================');

  if (testResults.failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
