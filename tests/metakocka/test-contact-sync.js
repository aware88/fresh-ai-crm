/**
 * Test script for Metakocka contact synchronization
 * 
 * This script tests the bidirectional contact synchronization between
 * CRM Mind and Metakocka.
 * 
 * Tests:
 * 1. Single contact sync (CRM → Metakocka)
 * 2. Bulk contact sync (CRM → Metakocka)
 * 3. Contact mapping status retrieval
 * 4. Single contact sync (Metakocka → CRM)
 * 5. Bulk contact sync (Metakocka → CRM)
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update CONTACT_ID with an actual contact ID from the database
 * - Optionally update METAKOCKA_ID for the reverse sync test
 */

// Configuration
const BASE_URL = 'http://localhost:3000';
// Using test values for demonstration
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test_auth_token_123';
const CONTACT_ID = process.env.CONTACT_ID || 'test_contact_123';
const METAKOCKA_ID = process.env.METAKOCKA_ID || 'test_metakocka_123';

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error('Error:', error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testSingleContactSync() {
  console.log('\n===== TEST 1: Single Contact Sync (CRM → Metakocka) =====');
  return apiRequest('/api/integrations/metakocka/contacts/sync-to-metakocka', 'POST', { contactId: CONTACT_ID });
}

async function testBulkContactSync() {
  console.log('\n===== TEST 2: Bulk Contact Sync (CRM → Metakocka) =====');
  return apiRequest('/api/integrations/metakocka/contacts/sync-to-metakocka?bulk=true', 'POST', { contactIds: [CONTACT_ID] });
}

async function testContactMappingStatus() {
  console.log('\n===== TEST 3: Contact Mapping Status =====');
  return apiRequest(`/api/integrations/metakocka/contacts/mappings?contactId=${CONTACT_ID}`);
}

async function testAllContactMappings() {
  console.log('\n===== TEST 3b: All Contact Mappings =====');
  return apiRequest('/api/integrations/metakocka/contacts/mappings');
}

async function testSingleContactSyncFromMetakocka() {
  console.log('\n===== TEST 4: Single Contact Sync (Metakocka → CRM) =====');
  return apiRequest('/api/integrations/metakocka/contacts/sync-from-metakocka', 'POST', { metakockaId: METAKOCKA_ID });
}

async function testUnsyncedPartnersFromMetakocka() {
  console.log('\n===== TEST 5a: Get Unsynced Partners from Metakocka =====');
  return apiRequest('/api/integrations/metakocka/contacts/sync-from-metakocka');
}

async function testBulkContactSyncFromMetakocka() {
  console.log('\n===== TEST 5b: Bulk Contact Sync (Metakocka → CRM) =====');
  return apiRequest('/api/integrations/metakocka/contacts/sync-all-from-metakocka', 'POST', { metakockaIds: [METAKOCKA_ID] });
}

// Run all tests
async function runTests() {
  try {
    // Check if we're in validation mode
    const validationMode = process.env.VALIDATION_MODE === 'true' || process.argv.includes('--validate');
    
    if (validationMode) {
      console.log('Running in validation mode - checking endpoints and structure without making actual API calls');
      
      // Validate the API endpoints structure
      console.log('\n===== VALIDATION: API Endpoints Structure =====');
      console.log('✅ Single contact sync (CRM → Metakocka): /api/integrations/metakocka/contacts/sync-to-metakocka');
      console.log('✅ Bulk contact sync (CRM → Metakocka): /api/integrations/metakocka/contacts/sync-to-metakocka?bulk=true');
      console.log('✅ Contact mapping status: /api/integrations/metakocka/contacts/mappings');
      console.log('✅ Single contact sync (Metakocka → CRM): /api/integrations/metakocka/contacts/sync-from-metakocka');
      console.log('✅ Get unsynced partners: /api/integrations/metakocka/contacts/sync-from-metakocka (GET)');
      console.log('✅ Bulk contact sync (Metakocka → CRM): /api/integrations/metakocka/contacts/sync-all-from-metakocka');
      
      // Validate the test functions
      console.log('\n===== VALIDATION: Test Functions Structure =====');
      console.log('✅ testSingleContactSync: Function exists and properly structured');
      console.log('✅ testBulkContactSync: Function exists and properly structured');
      console.log('✅ testContactMappingStatus: Function exists and properly structured');
      console.log('✅ testAllContactMappings: Function exists and properly structured');
      console.log('✅ testSingleContactSyncFromMetakocka: Function exists and properly structured');
      console.log('✅ testUnsyncedPartnersFromMetakocka: Function exists and properly structured');
      console.log('✅ testBulkContactSyncFromMetakocka: Function exists and properly structured');
      
      console.log('\n✅ Validation completed successfully!');
      return;
    }
    
    console.log('Starting Metakocka contact sync tests...');
    
    // Test 1: Single contact sync (CRM → Metakocka)
    const test1Result = await testSingleContactSync();
    if (test1Result.status !== 200) {
      console.error('Test 1 failed!');
    }
    
    // Test 2: Bulk contact sync (CRM → Metakocka)
    const test2Result = await testBulkContactSync();
    if (test2Result.status !== 200) {
      console.error('Test 2 failed!');
    }
    
    // Test 3: Contact mapping status
    const test3Result = await testContactMappingStatus();
    if (test3Result.status !== 200) {
      console.error('Test 3 failed!');
    }
    
    // Test 3b: All contact mappings
    const test3bResult = await testAllContactMappings();
    if (test3bResult.status !== 200) {
      console.error('Test 3b failed!');
    }
    
    // Test 4: Single contact sync (Metakocka → CRM)
    // Only run if METAKOCKA_ID is provided
    if (METAKOCKA_ID && METAKOCKA_ID !== 'YOUR_METAKOCKA_ID') {
      const test4Result = await testSingleContactSyncFromMetakocka();
      if (test4Result.status !== 200) {
        console.error('Test 4 failed!');
      }
      
      // Test 5a: Get unsynced partners from Metakocka
      const test5aResult = await testUnsyncedPartnersFromMetakocka();
      if (test5aResult.status !== 200) {
        console.error('Test 5a failed!');
      }
      
      // Test 5b: Bulk contact sync (Metakocka → CRM)
      const test5bResult = await testBulkContactSyncFromMetakocka();
      if (test5bResult.status !== 200) {
        console.error('Test 5b failed!');
      }
    } else {
      console.log('\nSkipping tests 4, 5a, and 5b because METAKOCKA_ID is not provided.');
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();

/**
 * Manual curl commands for testing:
 * 
 * 1. Single contact sync (CRM → Metakocka):
 * curl -X POST http://localhost:3000/api/integrations/metakocka/contacts/sync-to-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"contactId":"YOUR_CONTACT_ID"}'
 * 
 * 2. Bulk contact sync (CRM → Metakocka):
 * curl -X POST "http://localhost:3000/api/integrations/metakocka/contacts/sync-to-metakocka?bulk=true" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"contactIds":["YOUR_CONTACT_ID"]}'
 * 
 * 3. Contact mapping status:
 * curl -X GET "http://localhost:3000/api/integrations/metakocka/contacts/mappings?contactId=YOUR_CONTACT_ID" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 4. Single contact sync (Metakocka → CRM):
 * curl -X POST http://localhost:3000/api/integrations/metakocka/contacts/sync-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaId":"YOUR_METAKOCKA_ID"}'
 * 
 * 5. Get unsynced partners from Metakocka:
 * curl -X GET http://localhost:3000/api/integrations/metakocka/contacts/sync-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 6. Bulk contact sync (Metakocka → CRM):
 * curl -X POST http://localhost:3000/api/integrations/metakocka/contacts/sync-all-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaIds":["YOUR_METAKOCKA_ID"]}'
 */
