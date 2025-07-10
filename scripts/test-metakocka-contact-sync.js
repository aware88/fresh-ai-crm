/**
 * Test script for Metakocka contact sync API routes
 * 
 * This script tests the API routes with the mock services
 * using the x-test-mode header to bypass organization membership checks
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-123';
const TEST_CONTACT_ID = 'test-contact-456';
const TEST_AUTH_TOKEN = 'test-auth-token';

// Test headers for service role authentication
const headers = {
  'Content-Type': 'application/json',
  'x-supabase-auth': TEST_AUTH_TOKEN,
  'x-user-id': TEST_USER_ID
};

// Helper function to make API calls
async function callApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  console.log(`\n🔍 Testing ${method} ${endpoint}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Metakocka contact sync API tests...');
  
  // Test 1: Get contact mapping
  await callApi(`/api/integrations/metakocka/contacts/mappings?contactId=${TEST_CONTACT_ID}`);
  
  // Test 2: Get all contact mappings
  await callApi('/api/integrations/metakocka/contacts/mappings');
  
  // Test 3: Sync contact to Metakocka
  await callApi('/api/integrations/metakocka/contacts/sync-to-metakocka', 'POST', {
    contactId: TEST_CONTACT_ID
  });
  
  // Test 4: Sync contact from Metakocka
  await callApi('/api/integrations/metakocka/contacts/sync-from-metakocka', 'POST', {
    metakockaId: 'mk-test-123'
  });
  
  // Test 5: Sync all contacts from Metakocka
  await callApi('/api/integrations/metakocka/contacts/sync-all-from-metakocka', 'POST', {
    metakockaIds: ['mk-test-123', 'mk-test-456']
  });
  
  // Test 6: Sync contacts (bidirectional)
  await callApi('/api/integrations/metakocka/contacts/sync', 'POST', {
    direction: 'both'
  });
  
  console.log('\n✨ All tests completed!');
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.status !== 500;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  const isServerRunning = await checkDevServer();
  
  if (!isServerRunning) {
    console.error('❌ Error: Development server is not running. Please start it with "npm run dev" first.');
    process.exit(1);
  }
  
  await runTests();
}

main().catch(console.error);
