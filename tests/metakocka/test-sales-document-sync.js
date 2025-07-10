/**
 * Test script for Metakocka sales document synchronization
 * 
 * This script tests the bidirectional sales document synchronization between
 * CRM Mind and Metakocka.
 * 
 * Tests:
 * 1. Single sales document sync (CRM → Metakocka)
 * 2. Bulk sales document sync (CRM → Metakocka)
 * 3. Sales document mapping status retrieval (individual)
 * 4. Sales document mapping status retrieval (bulk)
 * 5. Single sales document sync (Metakocka → CRM)
 * 6. Get unsynced sales documents from Metakocka
 * 7. Bulk sales document sync (Metakocka → CRM)
 * 
 * Before running:
 * 1. Copy sales-document-sync-test.env.sample to .env
 * 2. Update AUTH_TOKEN with a valid authentication token
 * 3. Update DOCUMENT_ID with an actual sales document ID from the database
 * 4. Optionally update METAKOCKA_ID for the reverse sync test
 * 5. Run using the shell script: ./run-sales-document-sync-test.sh
 */

// Check for command line arguments
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test-mode');

// Configuration
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';
const USER_ID = process.env.USER_ID || 'test-user-id';
const DOCUMENT_ID = process.env.DOCUMENT_ID || 'test-document-id';
const METAKOCKA_ID = process.env.METAKOCKA_ID || 'test-metakocka-id';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  if (TEST_MODE) {
    // In test mode, return mock responses instead of making real API calls
    return mockApiResponse(endpoint, method, body);
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-supabase-auth': AUTH_TOKEN,
    'x-user-id': USER_ID,
    'x-test-mode': 'true'
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n${method} ${endpoint}`);
    const response = await fetch(url, options);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data, success: response.status >= 200 && response.status < 300 };
  } catch (error) {
    console.error('Error:', error.message);
    return { status: 500, data: { error: error.message }, success: false };
  }
}

// Mock API response generator
function mockApiResponse(endpoint, method, body) {
  console.log(`Mock API call: ${method} ${endpoint}`);
  
  // Generate appropriate mock responses based on the endpoint and method
  if (endpoint.includes('/sync') && !endpoint.includes('/sync-from-metakocka') && method === 'GET') {
    if (endpoint.includes('?documentId=')) {
      return {
        status: 'success',
        data: {
          documentId: DOCUMENT_ID,
          synced: true,
          metakockaId: METAKOCKA_ID,
          lastSyncedAt: new Date().toISOString()
        }
      };
    } else if (endpoint.includes('?documentIds=')) {
      return {
        status: 'success',
        data: {
          mappings: [
            {
              documentId: DOCUMENT_ID,
              synced: true,
              metakockaId: METAKOCKA_ID,
              lastSyncedAt: new Date().toISOString()
            }
          ]
        }
      };
    }
  } else if ((endpoint.includes('/sync') && !endpoint.includes('/sync-from-metakocka') && method === 'POST') || 
             (endpoint.includes('/sync-bulk-from-metakocka') && method === 'POST')) {
    if (body && body.documentId) {
      return {
        success: true,
        documentId: body.documentId,
        metakockaId: METAKOCKA_ID
      };
    } else if (body && body.documentIds) {
      return {
        success: true,
        total: body.documentIds.length,
        synced: body.documentIds.length,
        failed: 0
      };
    } else {
      return {
        success: true,
        total: 5,
        synced: 5,
        failed: 0
      };
    }
  } else if (endpoint.includes('/sync-from-metakocka') && method === 'GET') {
    return {
      status: 'success',
      data: {
        documents: [
          { id: METAKOCKA_ID, name: 'Test Document', date: new Date().toISOString() }
        ]
      }
    };
  } else if (endpoint.includes('/sync-from-metakocka') && method === 'POST') {
    return {
      status: 'success',
      data: {
        success: true,
        documentId: DOCUMENT_ID,
        metakockaId: body.metakockaId
      }
    };
  }
  
  // Default response
  return { success: true };
}

// Test functions
async function testSingleSalesDocumentSync() {
  console.log('\n===== TEST 1: Single Sales Document Sync (CRM → Metakocka) =====');
  return apiRequest('/api/integrations/metakocka/sales-documents/sync', 'POST', { documentId: DOCUMENT_ID });
}

async function testBulkSalesDocumentSync() {
  console.log('\n===== TEST 2: Bulk Sales Document Sync (CRM → Metakocka) =====');
  return apiRequest('/api/integrations/metakocka/sales-documents/sync', 'POST', { documentIds: [DOCUMENT_ID] });
}

async function testSalesDocumentSyncStatus() {
  console.log('\n===== TEST 3: Sales Document Sync Status =====');
  return apiRequest(`/api/integrations/metakocka/sales-documents/sync?documentId=${DOCUMENT_ID}`);
}

async function testAllSalesDocumentSyncStatus() {
  console.log('\n===== TEST 3b: All Sales Document Sync Status =====');
  return apiRequest('/api/integrations/metakocka/sales-documents/sync?documentIds=' + DOCUMENT_ID);
}

async function testSingleSalesDocumentSyncFromMetakocka() {
  console.log('\n===== TEST 4: Single Sales Document Sync (Metakocka → CRM) =====');
  return apiRequest('/api/integrations/metakocka/sales-documents/sync-from-metakocka', 'POST', { metakockaId: METAKOCKA_ID });
}

async function testUnsyncedSalesDocumentsFromMetakocka() {
  console.log('\n===== TEST 5: Get Unsynced Sales Documents from Metakocka =====');
  return apiRequest('/api/integrations/metakocka/sales-documents/sync-from-metakocka');
}

async function testBulkSalesDocumentSyncFromMetakocka() {
  console.log('\n===== TEST 6: Bulk Sales Document Sync (Metakocka → CRM) =====');
  try {
    // Since we don't have a dedicated endpoint, we'll use our client-side implementation
    // that syncs documents one by one
    const result = await apiRequest(
      '/api/integrations/metakocka/sales-documents/sync-bulk-from-metakocka',
      'POST',
      { metakockaIds: [METAKOCKA_ID] }
    );
    
    console.log('Response:', result);
    
    if (result.success) {
      console.log('✅ Test 6 passed!');
      testResults.passed++;
      return true;
    } else {
      throw new Error('Bulk sync failed');
    }
  } catch (error) {
    console.error('❌ Test 6 failed!', error.message);
    testResults.failed++;
    return false;
  }
}

// Helper function to record test results
function recordTestResult(testNumber, testName, result) {
  const success = result.success;
  const testResult = {
    test: `Test ${testNumber}: ${testName}`,
    status: success ? 'PASSED' : 'FAILED',
    statusCode: result.status,
    details: result.data
  };
  
  testResults.details.push(testResult);
  
  if (success) {
    testResults.passed++;
    console.log(`✅ Test ${testNumber} passed!`);
  } else {
    testResults.failed++;
    console.error(`❌ Test ${testNumber} failed!`);
  }
  
  return success;
}

// Helper function to record skipped tests
function recordSkippedTest(testNumber, testName, reason) {
  const testResult = {
    test: `Test ${testNumber}: ${testName}`,
    status: 'SKIPPED',
    reason: reason
  };
  
  testResults.details.push(testResult);
  testResults.skipped++;
  console.log(`⏭️ Test ${testNumber} skipped: ${reason}`);
}

// Run all tests
async function runAllTests() {
  try {
    console.log('\n🚀 Starting Metakocka sales document sync tests...');
    console.log('============================================');
    
    // Validate required parameters unless in test mode
    if (!TEST_MODE) {
      if (!AUTH_TOKEN) {
        console.error('❌ Error: AUTH_TOKEN is required');
        process.exit(1);
      }

      if (!DOCUMENT_ID) {
        console.error('❌ Error: DOCUMENT_ID is required');
        process.exit(1);
      }
    } else {
      console.log('🧪 Running in test mode with mock values');
      console.log('   No real API calls will be made');
    }
    
    // Test 1: Single sales document sync (CRM → Metakocka)
    const test1Result = await testSingleSalesDocumentSync();
    recordTestResult(1, 'Single Sales Document Sync (CRM → Metakocka)', test1Result);
    
    // Test 2: Bulk sales document sync (CRM → Metakocka)
    const test2Result = await testBulkSalesDocumentSync();
    recordTestResult(2, 'Bulk Sales Document Sync (CRM → Metakocka)', test2Result);
    
    // Test 3: Sales document sync status
    const test3Result = await testSalesDocumentSyncStatus();
    recordTestResult(3, 'Sales Document Sync Status', test3Result);
    
    // Test 4: All sales document sync status
    const test4Result = await testAllSalesDocumentSyncStatus();
    recordTestResult(4, 'All Sales Document Sync Status', test4Result);
    
    // Tests requiring METAKOCKA_ID
    if (METAKOCKA_ID && METAKOCKA_ID !== 'YOUR_METAKOCKA_ID') {
      // Test 5: Single sales document sync (Metakocka → CRM)
      const test5Result = await testSingleSalesDocumentSyncFromMetakocka();
      recordTestResult(5, 'Single Sales Document Sync (Metakocka → CRM)', test5Result);
      
      // Test 6: Get unsynced sales documents from Metakocka
      const test6Result = await testUnsyncedSalesDocumentsFromMetakocka();
      recordTestResult(6, 'Get Unsynced Sales Documents from Metakocka', test6Result);
      
      // Test 7: Bulk sales document sync (Metakocka → CRM)
      const test7Result = await testBulkSalesDocumentSyncFromMetakocka();
      recordTestResult(7, 'Bulk Sales Document Sync (Metakocka → CRM)', test7Result);
    } else {
      // Record skipped tests
      recordSkippedTest(5, 'Single Sales Document Sync (Metakocka → CRM)', 'METAKOCKA_ID not provided');
      recordSkippedTest(6, 'Get Unsynced Sales Documents from Metakocka', 'METAKOCKA_ID not provided');
      recordSkippedTest(7, 'Bulk Sales Document Sync (Metakocka → CRM)', 'METAKOCKA_ID not provided');
    }
    
    // Print test summary
    printTestSummary();
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  }
}

// Print test summary
function printTestSummary() {
  console.log('\n============================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log(`🔢 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  console.log('============================================');
  
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Please check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests completed successfully!');
  }
}

// Run the tests
runAllTests();

/**
 * Manual curl commands for testing:
 * 
 * 1. Single sales document sync (CRM → Metakocka):
 * curl -X POST http://localhost:3001/api/integrations/metakocka/sales-documents/sync \
 *   -H "x-supabase-auth: YOUR_AUTH_TOKEN" \
 *   -H "x-user-id: YOUR_USER_ID" \
 *   -H "x-test-mode: true" \
 *   -H "Content-Type: application/json" \
 *   -d '{"documentId":"YOUR_DOCUMENT_ID"}'
 * 
 * 2. Bulk sales document sync (CRM → Metakocka):
 * curl -X POST http://localhost:3001/api/integrations/metakocka/sales-documents/sync \
 *   -H "x-supabase-auth: YOUR_AUTH_TOKEN" \
 *   -H "x-user-id: YOUR_USER_ID" \
 *   -H "x-test-mode: true" \
 *   -H "Content-Type: application/json" \
 *   -d '{"documentIds":["YOUR_DOCUMENT_ID"]}'
 * 
 * 3. Sales document sync status:
 * curl -X GET "http://localhost:3001/api/integrations/metakocka/sales-documents/sync?documentId=YOUR_DOCUMENT_ID" \
 *   -H "x-supabase-auth: YOUR_AUTH_TOKEN" \
 *   -H "x-user-id: YOUR_USER_ID" \
 *   -H "x-test-mode: true"
 * 
 * 4. Single sales document sync (Metakocka → CRM):
 * curl -X POST http://localhost:3001/api/integrations/metakocka/sales-documents/sync-from-metakocka \
 *   -H "x-supabase-auth: YOUR_AUTH_TOKEN" \
 *   -H "x-user-id: YOUR_USER_ID" \
 *   -H "x-test-mode: true" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaId":"YOUR_METAKOCKA_ID"}'
 * 
 * 5. Get unsynced sales documents from Metakocka:
 * curl -X GET http://localhost:3001/api/integrations/metakocka/sales-documents/sync-from-metakocka \
 *   -H "x-supabase-auth: YOUR_AUTH_TOKEN" \
 *   -H "x-user-id: YOUR_USER_ID" \
 *   -H "x-test-mode: true"
 * 
 * 6. Bulk sales document sync (Metakocka → CRM):
 * Note: Currently not supported as we do not have a bulk sync endpoint from Metakocka
 */
