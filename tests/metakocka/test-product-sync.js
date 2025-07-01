/**
 * Test script for Metakocka product synchronization
 * 
 * This script tests the bidirectional product synchronization between
 * Fresh AI CRM and Metakocka.
 * 
 * Tests:
 * 1. Single product sync (CRM → Metakocka)
 * 2. Bulk product sync (CRM → Metakocka)
 * 3. Product mapping status retrieval
 * 4. Single product sync (Metakocka → CRM)
 * 5. Bulk product sync (Metakocka → CRM)
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update PRODUCT_ID with an actual product ID from the database
 * - Optionally update METAKOCKA_ID for the reverse sync test
 */

// Configuration
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN'; // Replace with a valid token
const PRODUCT_ID = process.env.PRODUCT_ID || 'YOUR_PRODUCT_ID'; // Replace with an actual product ID
const METAKOCKA_ID = process.env.METAKOCKA_ID || 'YOUR_METAKOCKA_ID'; // Replace with an actual Metakocka ID for reverse sync test

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
async function testSingleProductSync() {
  console.log('\n===== TEST 1: Single Product Sync (CRM → Metakocka) =====');
  return apiRequest('/api/products/sync', 'POST', { productId: PRODUCT_ID });
}

async function testBulkProductSync() {
  console.log('\n===== TEST 2: Bulk Product Sync (CRM → Metakocka) =====');
  return apiRequest('/api/products/sync/bulk', 'POST', { productIds: [PRODUCT_ID] });
}

async function testProductSyncStatus() {
  console.log('\n===== TEST 3: Product Sync Status =====');
  return apiRequest(`/api/products/sync?productId=${PRODUCT_ID}`);
}

async function testAllProductSyncStatus() {
  console.log('\n===== TEST 3b: All Product Sync Status =====');
  return apiRequest('/api/products/sync/bulk?productIds=' + PRODUCT_ID);
}

async function testSingleProductSyncFromMetakocka() {
  console.log('\n===== TEST 4: Single Product Sync (Metakocka → CRM) =====');
  return apiRequest('/api/products/sync-from-metakocka', 'POST', { metakockaId: METAKOCKA_ID });
}

async function testUnsyncedProductsFromMetakocka() {
  console.log('\n===== TEST 5a: Get Unsynced Products from Metakocka =====');
  return apiRequest('/api/products/sync-from-metakocka');
}

async function testBulkProductSyncFromMetakocka() {
  console.log('\n===== TEST 5b: Bulk Product Sync (Metakocka → CRM) =====');
  return apiRequest('/api/products/sync-all-from-metakocka', 'POST', { metakockaIds: [METAKOCKA_ID] });
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting Metakocka product sync tests...');
    
    // Test 1: Single product sync (CRM → Metakocka)
    const test1Result = await testSingleProductSync();
    if (test1Result.status !== 200) {
      console.error('Test 1 failed!');
    }
    
    // Test 2: Bulk product sync (CRM → Metakocka)
    const test2Result = await testBulkProductSync();
    if (test2Result.status !== 200) {
      console.error('Test 2 failed!');
    }
    
    // Test 3: Product sync status
    const test3Result = await testProductSyncStatus();
    if (test3Result.status !== 200) {
      console.error('Test 3 failed!');
    }
    
    // Test 3b: All product sync status
    const test3bResult = await testAllProductSyncStatus();
    if (test3bResult.status !== 200) {
      console.error('Test 3b failed!');
    }
    
    // Test 4: Single product sync (Metakocka → CRM)
    // Only run if METAKOCKA_ID is provided
    if (METAKOCKA_ID && METAKOCKA_ID !== 'YOUR_METAKOCKA_ID') {
      const test4Result = await testSingleProductSyncFromMetakocka();
      if (test4Result.status !== 200) {
        console.error('Test 4 failed!');
      }
      
      // Test 5a: Get unsynced products from Metakocka
      const test5aResult = await testUnsyncedProductsFromMetakocka();
      if (test5aResult.status !== 200) {
        console.error('Test 5a failed!');
      }
      
      // Test 5b: Bulk product sync (Metakocka → CRM)
      const test5bResult = await testBulkProductSyncFromMetakocka();
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
 * 1. Single product sync (CRM → Metakocka):
 * curl -X POST http://localhost:3000/api/products/sync \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"productId":"YOUR_PRODUCT_ID"}'
 * 
 * 2. Bulk product sync (CRM → Metakocka):
 * curl -X POST http://localhost:3000/api/products/sync/bulk \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"productIds":["YOUR_PRODUCT_ID"]}'
 * 
 * 3. Product sync status:
 * curl -X GET "http://localhost:3000/api/products/sync?productId=YOUR_PRODUCT_ID" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 4. Single product sync (Metakocka → CRM):
 * curl -X POST http://localhost:3000/api/products/sync-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaId":"YOUR_METAKOCKA_ID"}'
 * 
 * 5. Get unsynced products from Metakocka:
 * curl -X GET http://localhost:3000/api/products/sync-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 6. Bulk product sync (Metakocka → CRM):
 * curl -X POST http://localhost:3000/api/products/sync-all-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaIds":["YOUR_METAKOCKA_ID"]}'
 */
