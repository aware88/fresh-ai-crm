/**
 * Organization Branding API Test Script
 * 
 * This script tests the organization branding API endpoints:
 * - GET /api/admin/organizations/[id]/branding
 * - PUT /api/admin/organizations/[id]/branding
 *
 * Prerequisites:
 * - A running CRM Mind instance
 * - Valid admin authentication token
 * - Existing organization ID
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;

// Validation
if (!AUTH_TOKEN) {
  console.error('❌ ERROR: AUTH_TOKEN is required in .env file');
  process.exit(1);
}

if (!ORGANIZATION_ID) {
  console.error('❌ ERROR: ORGANIZATION_ID is required in .env file');
  process.exit(1);
}

// Test data
const testBrandingData = {
  logo_url: 'https://example.com/logo.png',
  primary_color: '#1a56db',
  secondary_color: '#4f46e5',
  accent_color: '#2563eb',
  font_family: 'Inter, system-ui, sans-serif',
  custom_css: '.custom-class { color: red; }',
  custom_domain: 'app.example.com',
  favicon_url: 'https://example.com/favicon.ico',
  email_header_image_url: 'https://example.com/email-header.png',
  email_footer_text: '© 2025 Example Company. All rights reserved.',
  login_background_url: 'https://example.com/login-bg.jpg'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

/**
 * Run a test and track results
 */
async function runTest(name, testFn) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    testResults.passed++;
    return true;
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test 1: Get organization branding
 */
async function testGetOrganizationBranding() {
  const response = await fetch(`${API_BASE_URL}/admin/organizations/${ORGANIZATION_ID}/branding`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API returned error: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  console.log('   Retrieved branding data:', data.branding ? 'Yes' : 'No');
  return data;
}

/**
 * Test 2: Update organization branding
 */
async function testUpdateOrganizationBranding() {
  const response = await fetch(`${API_BASE_URL}/admin/organizations/${ORGANIZATION_ID}/branding`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testBrandingData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API returned error: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  console.log('   Updated branding data:', data.branding ? 'Yes' : 'No');
  
  // Verify the updated data
  if (!data.branding) {
    throw new Error('No branding data returned after update');
  }
  
  // Check a few key fields
  if (data.branding.primary_color !== testBrandingData.primary_color) {
    throw new Error(`Primary color mismatch: ${data.branding.primary_color} vs ${testBrandingData.primary_color}`);
  }
  
  if (data.branding.font_family !== testBrandingData.font_family) {
    throw new Error(`Font family mismatch: ${data.branding.font_family} vs ${testBrandingData.font_family}`);
  }
  
  return data;
}

/**
 * Test 3: Verify organization branding after update
 */
async function testVerifyOrganizationBranding() {
  const { branding } = await testGetOrganizationBranding();
  
  if (!branding) {
    throw new Error('No branding data found after update');
  }
  
  // Verify all fields match what we set
  for (const [key, value] of Object.entries(testBrandingData)) {
    if (branding[key] !== value) {
      throw new Error(`Field ${key} mismatch: ${branding[key]} vs ${value}`);
    }
  }
  
  console.log('   All branding fields verified successfully');
  return branding;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Organization Branding API Tests');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`📍 Organization ID: ${ORGANIZATION_ID}`);
  
  // Run tests in sequence
  await runTest('Get organization branding', testGetOrganizationBranding);
  const updateSuccess = await runTest('Update organization branding', testUpdateOrganizationBranding);
  
  // Only run verification if update succeeded
  if (updateSuccess) {
    await runTest('Verify organization branding', testVerifyOrganizationBranding);
  } else {
    console.log('⏭️ Skipping verification test due to update failure');
    testResults.skipped++;
  }
  
  // Print test summary
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⏭️ Skipped: ${testResults.skipped}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error in tests:', error);
  process.exit(1);
});
