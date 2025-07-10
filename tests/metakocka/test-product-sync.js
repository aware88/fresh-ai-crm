/**
 * Test script for Metakocka product synchronization
 * 
 * This script tests the bidirectional product synchronization between
 * CRM Mind and Metakocka.
 * 
 * Tests:
 * 1. Single product sync (CRM → Metakocka)
 * 2. Bulk product sync (CRM → Metakocka)
 * 3. Product mapping status retrieval
 * 4. Single product sync (Metakocka → CRM)
 * 5. Bulk product sync (Metakocka → CRM)
 * 
 * Before running:
 * - Update NEXT_PUBLIC_SUPABASE_URL with a valid Supabase URL
 * - Update SUPABASE_SERVICE_ROLE_KEY with a valid Supabase service role key
 * - Update PRODUCT_ID with an actual product ID from the database
 * - Optionally update METAKOCKA_ID for the reverse sync test
 */

// Load environment variables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check if we should use test mode or real data
const USE_TEST_MODE = process.env.USE_TEST_MODE !== 'false';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

if (!process.env.PRODUCT_ID) {
  console.error('Error: PRODUCT_ID environment variable is not set');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Set up constants
const PRODUCT_ID = process.env.PRODUCT_ID;
const METAKOCKA_ID = process.env.METAKOCKA_ID;
const API_BASE_URL = 'http://localhost:3000';

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`${method} ${endpoint}`);
  
  // Get the user ID for the test user
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
    filter: { email: 'tim.mak88@gmail.com' }
  });
  
  if (userError || !userData || !userData.users || userData.users.length === 0) {
    console.error('User not found');
    if (userError) console.error(userError);
    throw new Error('User not found');
  }
  
  const userId = userData.users[0].id;
  
  const headers = {
    'Content-Type': 'application/json',
    'x-supabase-auth': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'x-user-id': userId,
  };
  
  // Only add testing mode header if enabled
  if (USE_TEST_MODE) {
    headers['x-testing-mode'] = 'true';
    console.log('Running in TEST MODE');
  } else {
    console.log('Running with REAL DATA');
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      throw new Error('Non-JSON response received');
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Test functions
async function testSingleProductSync() {
  console.log('\n===== TEST 1: Single Product Sync (CRM → Metakocka) =====');
  const url = `${API_BASE_URL}/api/integrations/metakocka/products/sync`;
  console.log(`POST ${url}`);
  
  try {
    const result = await apiRequest('/api/integrations/metakocka/products/sync', 'POST', { productIds: [PRODUCT_ID] });
    console.log('Test 1 succeeded!');
    return result;
  } catch (error) {
    console.log('Test 1 failed!');
    return null;
  }
}

async function testBulkProductSync() {
  console.log('\n===== TEST 2: Bulk Product Sync (CRM → Metakocka) =====');
  try {
    const result = await apiRequest('/api/integrations/metakocka/products/sync', 'POST', { productIds: [PRODUCT_ID] });
    console.log('Test 2 succeeded!');
    return result;
  } catch (error) {
    console.log('Test 2 failed!');
    return null;
  }
}

async function testProductSyncStatus() {
  console.log('\n===== TEST 3: Product Sync Status =====');
  try {
    const result = await apiRequest(`/api/integrations/metakocka/products/sync/${PRODUCT_ID}`);
    console.log('Test 3 succeeded!');
    return result;
  } catch (error) {
    console.log('Test 3 failed!');
    return null;
  }
}

async function testAllProductSyncStatus() {
  console.log('\n===== TEST 3b: All Product Sync Status =====');
  try {
    const result = await apiRequest('/api/integrations/metakocka/products/sync');
    console.log('Test 3b succeeded!');
    return result;
  } catch (error) {
    console.log('Test 3b failed!');
    return null;
  }
}

async function testSingleProductSyncFromMetakocka() {
  console.log('\n===== TEST 4: Single Product Sync (Metakocka → CRM) =====');
  try {
    const result = await apiRequest('/api/integrations/metakocka/products/sync-from-metakocka', 'POST', { metakockaId: METAKOCKA_ID });
    console.log('Test 4 succeeded!');
    return result;
  } catch (error) {
    console.log('Test 4 failed!');
    return null;
  }
}

async function testUnsyncedProductsFromMetakocka() {
  console.log('\n===== TEST 5a: Get Unsynced Products from Metakocka =====');
  try {
    const result = await apiRequest('/api/integrations/metakocka/products/sync-from-metakocka');
    console.log('Test 5a succeeded!');
    return result;
  } catch (error) {
    console.log('Test 5a failed!');
    return null;
  }
}

async function testBulkProductSyncFromMetakocka() {
  console.log('\n===== TEST 5b: Bulk Product Sync (Metakocka → CRM) =====');
  try {
    const result = await apiRequest('/api/integrations/metakocka/products/sync-all-from-metakocka', 'POST', { metakockaIds: [METAKOCKA_ID] });
    console.log('Test 5b succeeded!');
    return result;
  } catch (error) {
    console.log('Test 5b failed!');
    return null;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting Metakocka product sync tests...');
    
    // Test 1: Single product sync (CRM → Metakocka)
    const test1Result = await testSingleProductSync();
    
    // Test 2: Bulk product sync (CRM → Metakocka)
    const test2Result = await testBulkProductSync();
    
    // Test 3: Product sync status
    const test3Result = await testProductSyncStatus();
    
    // Test 3b: All product sync status
    const test3bResult = await testAllProductSyncStatus();
    
    // Test 4: Single product sync (Metakocka → CRM)
    // Only run if METAKOCKA_ID is provided
    if (METAKOCKA_ID && METAKOCKA_ID !== 'YOUR_METAKOCKA_ID') {
      const test4Result = await testSingleProductSyncFromMetakocka();
      
      // Test 5a: Get unsynced products from Metakocka
      const test5aResult = await testUnsyncedProductsFromMetakocka();
      
      // Test 5b: Bulk product sync (Metakocka → CRM)
      const test5bResult = await testBulkProductSyncFromMetakocka();
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
 * curl -X POST http://localhost:3000/api/integrations/metakocka/products/sync \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"productIds":["YOUR_PRODUCT_ID"]}'
 * 
 * 2. Bulk product sync (CRM → Metakocka):
 * curl -X POST http://localhost:3000/api/integrations/metakocka/products/sync \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"productIds":["YOUR_PRODUCT_ID"]}'
 * 
 * 3. Product sync status:
 * curl -X GET "http://localhost:3000/api/integrations/metakocka/products/sync/YOUR_PRODUCT_ID" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 4. Single product sync (Metakocka → CRM):
 * curl -X POST http://localhost:3000/api/integrations/metakocka/products/sync-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaId":"YOUR_METAKOCKA_ID"}'
 * 
 * 5. Get unsynced products from Metakocka:
 * curl -X GET http://localhost:3000/api/integrations/metakocka/products/sync-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 6. Bulk product sync (Metakocka → CRM):
 * curl -X POST http://localhost:3000/api/integrations/metakocka/products/sync-all-from-metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"metakockaIds":["YOUR_METAKOCKA_ID"]}'
 */
