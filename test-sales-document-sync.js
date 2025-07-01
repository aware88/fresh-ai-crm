/**
 * Test script for sales document synchronization with Metakocka
 * 
 * This script tests:
 * 1. Single sales document sync (CRM → Metakocka)
 * 2. Bulk sales document sync (CRM → Metakocka)
 * 3. Sales document mapping status retrieval
 * 4. Single sales document sync (Metakocka → CRM)
 * 5. Error handling and status tracking
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update DOCUMENT_ID with an actual sales document ID from the database
 * - Optionally update METAKOCKA_ID for the reverse sync test
 */

// Configuration - Replace these values with your actual data
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN';
const DOCUMENT_ID = 'YOUR_DOCUMENT_ID';
const METAKOCKA_ID = 'YOUR_METAKOCKA_ID'; // For reverse sync test
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function callApi(endpoint, method = 'GET', body = null) {
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
    console.log(`\n🔄 Calling ${method} ${endpoint}...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error(data);
      return { success: false, error: data };
    }
    
    console.log(`✅ Success: ${response.status} ${response.statusText}`);
    console.log(JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 1: Single sales document sync (CRM → Metakocka)
async function testSingleDocumentSync() {
  console.log('\n==== TEST 1: Single Sales Document Sync (CRM → Metakocka) ====');
  return await callApi(`/sales-documents/${DOCUMENT_ID}/sync`, 'POST');
}

// Test 2: Bulk sales document sync (CRM → Metakocka)
async function testBulkDocumentSync() {
  console.log('\n==== TEST 2: Bulk Sales Document Sync (CRM → Metakocka) ====');
  return await callApi('/sales-documents/sync-all', 'POST');
}

// Test 3: Sales document mapping status retrieval
async function testGetSyncStatus() {
  console.log('\n==== TEST 3: Get Sales Document Sync Status ====');
  return await callApi(`/sales-documents/${DOCUMENT_ID}/sync-status`, 'GET');
}

// Test 4: Single sales document sync (Metakocka → CRM)
async function testImportFromMetakocka() {
  console.log('\n==== TEST 4: Import Sales Document from Metakocka ====');
  return await callApi('/sales-documents/import-from-metakocka', 'POST', {
    metakockaId: METAKOCKA_ID,
    documentType: 'invoice' // Change as needed: invoice, offer, order, proforma
  });
}

// Test 5: Error handling - Try to sync a non-existent document
async function testErrorHandling() {
  console.log('\n==== TEST 5: Error Handling - Non-existent Document ====');
  return await callApi('/sales-documents/non-existent-id/sync', 'POST');
}

// Run all tests in sequence
async function runAllTests() {
  console.log('🚀 Starting Sales Document Sync Tests...');
  
  try {
    // Test 1: Single document sync
    const test1Result = await testSingleDocumentSync();
    if (!test1Result.success) {
      console.log('⚠️ Test 1 failed, but continuing with other tests...');
    }
    
    // Test 2: Bulk document sync
    const test2Result = await testBulkDocumentSync();
    if (!test2Result.success) {
      console.log('⚠️ Test 2 failed, but continuing with other tests...');
    }
    
    // Test 3: Get sync status
    const test3Result = await testGetSyncStatus();
    if (!test3Result.success) {
      console.log('⚠️ Test 3 failed, but continuing with other tests...');
    }
    
    // Test 4: Import from Metakocka
    const test4Result = await testImportFromMetakocka();
    if (!test4Result.success) {
      console.log('⚠️ Test 4 failed, but continuing with other tests...');
    }
    
    // Test 5: Error handling
    const test5Result = await testErrorHandling();
    if (test5Result.success) {
      console.log('⚠️ Test 5 should have failed but succeeded. Check error handling.');
    } else {
      console.log('✅ Test 5 correctly handled the error case.');
    }
    
    console.log('\n🏁 All tests completed!');
  } catch (error) {
    console.error(`\n❌ Test suite failed: ${error.message}`);
  }
}

// Run the tests
runAllTests();

/**
 * Manual test commands (for reference):
 * 
 * 1. Single document sync:
 * curl -X POST http://localhost:3000/api/sales-documents/YOUR_DOCUMENT_ID/sync \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json"
 * 
 * 2. Bulk document sync:
 * curl -X POST http://localhost:3000/api/sales-documents/sync-all \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json"
 * 
 * 3. Get sync status:
 * curl -X GET http://localhost:3000/api/sales-documents/YOUR_DOCUMENT_ID/sync-status \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 4. Import from Metakocka:
 * curl -X POST http://localhost:3000/api/sales-documents/import-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaId": "YOUR_METAKOCKA_ID", "documentType": "invoice"}'
 */
