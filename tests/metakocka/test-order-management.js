/**
 * Comprehensive test script for Metakocka Order Management Integration
 * 
 * This script tests the following functionality:
 * 1. Order sync from CRM to Metakocka
 * 2. Order status updates
 * 3. Order fulfillment
 * 4. Order cancellation
 * 5. Order sync from Metakocka to CRM
 * 
 * Environment variables required:
 * - AUTH_TOKEN: Authentication token for API requests
 * - ORDER_ID: (Optional) ID of an existing order to test with
 * - METAKOCKA_ID: (Optional) ID of an existing Metakocka order to test sync from Metakocka
 * - API_BASE_URL: (Optional) Base URL for API requests (default: http://localhost:3000/api)
 * - DEBUG: (Optional) Set to 'true' to enable debug logging
 */

const fetch = require('node-fetch');

// Configuration
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORDER_ID = process.env.ORDER_ID;
const METAKOCKA_ID = process.env.METAKOCKA_ID;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const DEBUG = process.env.DEBUG === 'true';

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Test utilities
async function runTest(testName, testFn) {
  testResults.total++;
  console.log(`\n🧪 Test ${testResults.total}: ${testName}`);
  console.log('---------------------------------------------------');
  
  try {
    await testFn();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`Error: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

async function skipTest(testName, reason) {
  testResults.total++;
  testResults.skipped++;
  console.log(`\n🧪 Test ${testResults.total}: ${testName}`);
  console.log('---------------------------------------------------');
  console.log(`⏭️ SKIPPED: ${reason}`);
}

// Helper functions
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  if (DEBUG) {
    console.log(`Making ${method} request to ${url}`);
    if (body) console.log('Request body:', JSON.stringify(body, null, 2));
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (DEBUG) {
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  }
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${data.error || JSON.stringify(data)}`);
  }
  
  return data;
}

async function createTestOrder() {
  console.log('Creating test order...');
  
  const order = {
    document_type: 'order',
    document_date: new Date().toISOString().split('T')[0],
    customer_name: 'Test Customer',
    total_amount: 123.45,
    status: 'draft',
    items: [
      {
        product_id: '00000000-0000-0000-0000-000000000001', // Replace with a real product ID if needed
        name: 'Test Product',
        quantity: 2,
        unit_price: 50,
        total_price: 100
      },
      {
        product_id: '00000000-0000-0000-0000-000000000002', // Replace with a real product ID if needed
        name: 'Another Test Product',
        quantity: 1,
        unit_price: 23.45,
        total_price: 23.45
      }
    ]
  };
  
  const response = await makeRequest('/sales-documents', 'POST', order);
  console.log(`Created test order with ID: ${response.id}`);
  return response.id;
}

// Test functions
async function testSyncOrder(orderId) {
  console.log(`Testing order sync for order ID: ${orderId}`);
  
  const response = await makeRequest('/integrations/metakocka/orders/sync', 'POST', { orderId });
  
  if (!response.success) {
    throw new Error(`Failed to sync order: ${response.error}`);
  }
  
  console.log(`Order synced successfully with Metakocka ID: ${response.metakockaId}`);
  return response.metakockaId;
}

async function testGetOrderSyncStatus(orderId) {
  console.log(`Testing get order sync status for order ID: ${orderId}`);
  
  const response = await makeRequest(`/integrations/metakocka/orders/sync?orderId=${orderId}`, 'GET');
  
  if (!response.mapping) {
    throw new Error('No mapping found for order');
  }
  
  console.log(`Order sync status: ${response.mapping.sync_status}`);
  console.log(`Metakocka ID: ${response.mapping.metakocka_id}`);
  return response.mapping;
}

async function testUpdateOrderStatus(orderId, status) {
  console.log(`Testing update order status to ${status} for order ID: ${orderId}`);
  
  const response = await makeRequest('/integrations/metakocka/orders/status', 'POST', { orderId, status });
  
  if (!response.success) {
    throw new Error(`Failed to update order status: ${response.error}`);
  }
  
  console.log(`Order status updated successfully to: ${status}`);
  return response;
}

async function testFulfillOrder(orderId) {
  console.log(`Testing order fulfillment for order ID: ${orderId}`);
  
  const fulfillmentData = {
    fulfillment_date: new Date().toISOString().split('T')[0],
    tracking_number: 'TEST-TRACKING-123',
    shipping_carrier: 'Test Carrier'
  };
  
  const response = await makeRequest('/integrations/metakocka/orders/fulfill', 'POST', { 
    orderId, 
    fulfillmentData 
  });
  
  if (!response.success) {
    throw new Error(`Failed to fulfill order: ${response.error}`);
  }
  
  console.log('Order fulfilled successfully');
  return response;
}

async function testCancelOrder(orderId) {
  console.log(`Testing order cancellation for order ID: ${orderId}`);
  
  const response = await makeRequest('/integrations/metakocka/orders/cancel', 'POST', { 
    orderId, 
    cancellationReason: 'Test cancellation' 
  });
  
  if (!response.success) {
    throw new Error(`Failed to cancel order: ${response.error}`);
  }
  
  console.log('Order cancelled successfully');
  return response;
}

async function testGetUnsyncedOrdersFromMetakocka() {
  console.log('Testing get unsynced orders from Metakocka');
  
  const response = await makeRequest('/integrations/metakocka/orders/sync-from-metakocka', 'GET');
  
  console.log(`Found ${response.unsyncedOrders.length} unsynced orders`);
  return response.unsyncedOrders;
}

async function testSyncOrderFromMetakocka(metakockaId) {
  console.log(`Testing sync order from Metakocka with ID: ${metakockaId}`);
  
  const response = await makeRequest('/integrations/metakocka/orders/sync-from-metakocka', 'POST', { metakockaId });
  
  if (!response.success) {
    throw new Error(`Failed to sync order from Metakocka: ${response.error}`);
  }
  
  console.log(`Order synced successfully from Metakocka with CRM ID: ${response.orderId}`);
  return response.orderId;
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Metakocka Order Management Integration Tests');
  console.log('=====================================================');
  
  // Validate required environment variables
  if (!AUTH_TOKEN) {
    console.error('❌ ERROR: AUTH_TOKEN environment variable is required');
    process.exit(1);
  }
  
  let testOrderId = ORDER_ID;
  let createdTestOrder = false;
  
  // Create a test order if not provided
  if (!testOrderId) {
    try {
      testOrderId = await createTestOrder();
      createdTestOrder = true;
      console.log(`Created test order with ID: ${testOrderId}`);
    } catch (error) {
      console.error('❌ ERROR: Failed to create test order:', error.message);
      process.exit(1);
    }
  }
  
  // Test 1: Sync order from CRM to Metakocka
  let metakockaId;
  await runTest('Sync order from CRM to Metakocka', async () => {
    metakockaId = await testSyncOrder(testOrderId);
    if (!metakockaId) throw new Error('No Metakocka ID returned');
  });
  
  // Test 2: Get order sync status
  await runTest('Get order sync status', async () => {
    const mapping = await testGetOrderSyncStatus(testOrderId);
    if (mapping.sync_status !== 'synced') {
      throw new Error(`Unexpected sync status: ${mapping.sync_status}`);
    }
  });
  
  // Test 3: Update order status
  await runTest('Update order status to confirmed', async () => {
    await testUpdateOrderStatus(testOrderId, 'confirmed');
  });
  
  // Test 4: Update order status to processing
  await runTest('Update order status to processing', async () => {
    await testUpdateOrderStatus(testOrderId, 'processing');
  });
  
  // Test 5: Fulfill order
  await runTest('Fulfill order', async () => {
    await testFulfillOrder(testOrderId);
  });
  
  // Test 6: Get unsynced orders from Metakocka
  let unsyncedOrders;
  await runTest('Get unsynced orders from Metakocka', async () => {
    unsyncedOrders = await testGetUnsyncedOrdersFromMetakocka();
  });
  
  // Test 7: Sync order from Metakocka to CRM
  if (METAKOCKA_ID) {
    await runTest('Sync order from Metakocka to CRM', async () => {
      await testSyncOrderFromMetakocka(METAKOCKA_ID);
    });
  } else if (unsyncedOrders && unsyncedOrders.length > 0) {
    await runTest('Sync first unsynced order from Metakocka to CRM', async () => {
      await testSyncOrderFromMetakocka(unsyncedOrders[0].id);
    });
  } else {
    await skipTest('Sync order from Metakocka to CRM', 'No Metakocka ID provided and no unsynced orders found');
  }
  
  // Test 8: Cancel order (only if we created a test order)
  if (createdTestOrder) {
    await runTest('Cancel order', async () => {
      await testCancelOrder(testOrderId);
    });
  } else {
    await skipTest('Cancel order', 'Skipping cancellation for user-provided order ID');
  }
  
  // Print test summary
  console.log('\n=====================================================');
  console.log('📊 Test Summary');
  console.log('=====================================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log('=====================================================');
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Unhandled error during test execution:', error);
  process.exit(1);
});
