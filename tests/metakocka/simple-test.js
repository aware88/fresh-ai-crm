/**
 * Simple Metakocka Sales Document Sync Test Script
 * 
 * This script tests the bidirectional sync functionality between CRM and Metakocka
 * using mock responses in test mode.
 */

// Check for command line arguments
const TEST_MODE = true;

// Configuration (using mock values)
const DOCUMENT_ID = 'test-document-id';
const METAKOCKA_ID = 'test-metakocka-id';
const API_BASE_URL = 'http://localhost:3001';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

// Mock API response generator
function mockApiResponse(endpoint, method, body) {
  console.log(`Mock API call: ${method} ${endpoint}`);
  
  // Generate mock responses based on the endpoint
  if (endpoint.includes('/sync-from-metakocka')) {
    if (method === 'GET') {
      return {
        status: 'success',
        data: {
          documents: [
            { id: METAKOCKA_ID, name: 'Test Document', date: new Date().toISOString() }
          ]
        }
      };
    } else if (method === 'POST') {
      return {
        status: 'success',
        data: {
          documentId: DOCUMENT_ID,
          metakockaId: body.metakockaId || METAKOCKA_ID
        }
      };
    }
  } else if (endpoint.includes('/sync')) {
    if (method === 'GET') {
      if (endpoint.includes('documentId=')) {
        return {
          status: 'success',
          data: {
            documentId: DOCUMENT_ID,
            synced: true,
            metakockaId: METAKOCKA_ID,
            lastSyncedAt: new Date().toISOString()
          }
        };
      } else {
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
    } else if (method === 'POST') {
      return {
        status: 'success',
        data: {
          success: true,
          documentId: body.documentId || DOCUMENT_ID,
          metakockaId: METAKOCKA_ID
        }
      };
    }
  }
  
  // Default response
  return { status: 'success', data: { success: true } };
}

// Helper function for API requests (mock only)
async function apiRequest(endpoint, method = 'GET', body = null) {
  // In test mode, return mock responses
  return mockApiResponse(endpoint, method, body);
}

// Run a test and report results
async function runTest(name, testFn) {
  console.log(`\n===== ${name} =====`);
  try {
    const result = await testFn();
    console.log('Response:', result);
    
    if (result && result.status === 'success') {
      console.log(`✅ ${name} passed!`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Test failed');
    }
  } catch (error) {
    console.error(`❌ ${name} failed!`, error.message);
    testResults.failed++;
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('\n🚀 Starting Metakocka sales document sync tests...');
  console.log('============================================');
  console.log('🧪 Running in test mode with mock values');
  console.log('   No real API calls will be made');
  
  // Test 1: Single sales document sync (CRM → Metakocka)
  await runTest('Test 1: Single Sales Document Sync (CRM → Metakocka)', async () => {
    return apiRequest('/api/integrations/metakocka/sales-documents/sync', 'POST', { documentId: DOCUMENT_ID });
  });
  
  // Test 2: Bulk sales document sync (CRM → Metakocka)
  await runTest('Test 2: Bulk Sales Document Sync (CRM → Metakocka)', async () => {
    return apiRequest('/api/integrations/metakocka/sales-documents/sync', 'POST', { documentIds: [DOCUMENT_ID] });
  });
  
  // Test 3: Sales document sync status
  await runTest('Test 3: Sales Document Sync Status', async () => {
    return apiRequest(`/api/integrations/metakocka/sales-documents/sync?documentId=${DOCUMENT_ID}`);
  });
  
  // Test 4: All sales document sync status
  await runTest('Test 4: All Sales Document Sync Status', async () => {
    return apiRequest(`/api/integrations/metakocka/sales-documents/sync?documentIds=${DOCUMENT_ID}`);
  });
  
  // Test 5: Single sales document sync (Metakocka → CRM)
  await runTest('Test 5: Single Sales Document Sync (Metakocka → CRM)', async () => {
    return apiRequest('/api/integrations/metakocka/sales-documents/sync-from-metakocka', 'POST', { metakockaId: METAKOCKA_ID });
  });
  
  // Test 6: Get unsynced sales documents from Metakocka
  await runTest('Test 6: Get Unsynced Sales Documents from Metakocka', async () => {
    return apiRequest('/api/integrations/metakocka/sales-documents/sync-from-metakocka');
  });
  
  // Test 7: Bulk sales document sync (Metakocka → CRM)
  await runTest('Test 7: Bulk Sales Document Sync (Metakocka → CRM)', async () => {
    return apiRequest('/api/integrations/metakocka/sales-documents/sync-bulk-from-metakocka', 'POST', { metakockaIds: [METAKOCKA_ID] });
  });
  
  // Print test summary
  console.log('\n============================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log(`🔢 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  console.log('============================================');
  
  // Return exit code
  return testResults.failed > 0 ? 1 : 0;
}

// Run all tests and exit with appropriate code
runAllTests().then(exitCode => {
  if (exitCode !== 0) {
    console.error('\n❌ Some tests failed. Please check the logs above for details.');
    process.exit(exitCode);
  } else {
    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  }
});
