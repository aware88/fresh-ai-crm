/**
 * Comprehensive test script for Metakocka Order Management Integration
 *
 * This script tests the following functionality:
 * 1. Creating a test order
 * 2. Syncing order to Metakocka
 * 3. Getting order sync status
 * 4. Updating order status
 * 5. Fulfilling order
 * 6. Cancelling order
 * 7. Syncing orders from Metakocka
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
let env = {};
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) return;
    
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  
  console.log('✅ Loaded environment variables from .env file');
} catch (error) {
  console.warn('⚠️ Failed to load .env file:', error.message);
  console.warn('⚠️ Using default configuration');
}

// Configuration
const API_BASE_URL = env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = env.AUTH_TOKEN || 'test_token';
const ORDER_ID = env.ORDER_ID || null;
const METAKOCKA_ID = env.METAKOCKA_ID || null;
const DEBUG = env.DEBUG === 'true';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Helper function for making API requests
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
  
  try {
    const response = await fetch(url, options);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Try to get text response for debugging
      const text = await response.text();
      if (DEBUG) {
        console.log('Response status:', response.status);
        console.log('Response content type:', contentType);
        console.log('Response text (first 200 chars):', text.substring(0, 200));
      }
      return { 
        status: response.status, 
        error: 'Invalid JSON response', 
        contentType,
        text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      };
    }
    
    const data = await response.json();
    
    if (DEBUG) {
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));
    }
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { status: 500, error: error.message };
  }
}

// Helper function for test reporting
function reportTest(name, result, details = null) {
  testResults.total++;
  
  if (result === 'passed') {
    testResults.passed++;
    console.log(`✅ ${name}: PASSED`);
  } else if (result === 'failed') {
    testResults.failed++;
    console.log(`❌ ${name}: FAILED${details ? ' - ' + details : ''}`);
  } else if (result === 'skipped') {
    testResults.skipped++;
    console.log(`⏭️ ${name}: SKIPPED${details ? ' - ' + details : ''}`);
  }
}

// Test function to create a test order
async function createTestOrder() {
  console.log('\n🧪 TEST 1: Creating test order...');
  
  // If ORDER_ID is provided, skip creation
  if (ORDER_ID) {
    reportTest('Create Order', 'skipped', 'Using provided ORDER_ID');
    return ORDER_ID;
  }
  
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
  
  const result = await makeRequest('/sales-documents', 'POST', order);
  
  if (result.status === 201 || result.status === 200) {
    reportTest('Create Order', 'passed');
    return result.data.id;
  } else {
    reportTest('Create Order', 'failed', result.error || `Status: ${result.status}`);
    if (result.text) {
      console.log('Response preview:', result.text);
    }
    return null;
  }
}

// Test function to sync an order to Metakocka
async function syncOrderToMetakocka(orderId) {
  console.log(`\n🧪 TEST 2: Syncing order ${orderId} to Metakocka...`);
  
  if (!orderId) {
    reportTest('Sync to Metakocka', 'skipped', 'No valid order ID');
    return null;
  }
  
  const result = await makeRequest('/integrations/metakocka/orders/sync', 'POST', { orderId });
  
  if (result.status === 200 && result.data && result.data.success) {
    reportTest('Sync to Metakocka', 'passed');
    return result.data.metakockaId;
  } else {
    reportTest('Sync to Metakocka', 'failed', result.error || `Status: ${result.status}`);
    return null;
  }
}

// Test function to get order sync status
async function getOrderSyncStatus(orderId) {
  console.log(`\n🧪 TEST 3: Getting sync status for order ${orderId}...`);
  
  if (!orderId) {
    reportTest('Get Sync Status', 'skipped', 'No valid order ID');
    return null;
  }
  
  const result = await makeRequest(`/integrations/metakocka/orders/sync?orderId=${orderId}`, 'GET');
  
  if (result.status === 200) {
    reportTest('Get Sync Status', 'passed');
    return result.data;
  } else {
    reportTest('Get Sync Status', 'failed', result.error || `Status: ${result.status}`);
    return null;
  }
}

// Test function to update order status
async function updateOrderStatus(orderId, status) {
  console.log(`\n🧪 TEST 4: Updating order ${orderId} status to ${status}...`);
  
  if (!orderId) {
    reportTest(`Update Status to ${status}`, 'skipped', 'No valid order ID');
    return false;
  }
  
  const result = await makeRequest('/integrations/metakocka/orders/status', 'POST', { orderId, status });
  
  if (result.status === 200 && result.data && result.data.success) {
    reportTest(`Update Status to ${status}`, 'passed');
    return true;
  } else {
    reportTest(`Update Status to ${status}`, 'failed', result.error || `Status: ${result.status}`);
    return false;
  }
}

// Test function to fulfill an order
async function fulfillOrder(orderId) {
  console.log(`\n🧪 TEST 5: Fulfilling order ${orderId}...`);
  
  if (!orderId) {
    reportTest('Fulfill Order', 'skipped', 'No valid order ID');
    return false;
  }
  
  const fulfillmentData = {
    tracking_number: 'TRACK123456',
    shipping_carrier: 'Test Carrier',
    notes: 'Test fulfillment',
    fulfillment_date: new Date().toISOString().split('T')[0]
  };
  
  const result = await makeRequest('/integrations/metakocka/orders/fulfill', 'POST', { orderId, fulfillmentData });
  
  if (result.status === 200 && result.data && result.data.success) {
    reportTest('Fulfill Order', 'passed');
    return true;
  } else {
    reportTest('Fulfill Order', 'failed', result.error || `Status: ${result.status}`);
    return false;
  }
}

// Test function to cancel an order
async function cancelOrder(orderId) {
  console.log(`\n🧪 TEST 6: Cancelling order ${orderId}...`);
  
  if (!orderId) {
    reportTest('Cancel Order', 'skipped', 'No valid order ID');
    return false;
  }
  
  const cancellationReason = 'Test cancellation';
  
  const result = await makeRequest('/integrations/metakocka/orders/cancel', 'POST', { orderId, cancellationReason });
  
  if (result.status === 200 && result.data && result.data.success) {
    reportTest('Cancel Order', 'passed');
    return true;
  } else {
    reportTest('Cancel Order', 'failed', result.error || `Status: ${result.status}`);
    return false;
  }
}

// Test function to get unsynced orders from Metakocka
async function getUnsyncedOrdersFromMetakocka() {
  console.log('\n🧪 TEST 7: Getting unsynced orders from Metakocka...');
  
  const result = await makeRequest('/integrations/metakocka/orders/unsynced', 'GET');
  
  if (result.status === 200) {
    reportTest('Get Unsynced Orders', 'passed');
    return result.data;
  } else {
    reportTest('Get Unsynced Orders', 'failed', result.error || `Status: ${result.status}`);
    return null;
  }
}

// Test function to sync a specific order from Metakocka
async function syncOrderFromMetakocka(metakockaId) {
  console.log(`\n🧪 TEST 8: Syncing order from Metakocka (ID: ${metakockaId})...`);
  
  if (!metakockaId) {
    reportTest('Sync from Metakocka', 'skipped', 'No valid Metakocka ID');
    return null;
  }
  
  const result = await makeRequest('/integrations/metakocka/orders/sync-from', 'POST', { metakockaId });
  
  if (result.status === 200 && result.data && result.data.success) {
    reportTest('Sync from Metakocka', 'passed');
    return result.data.orderId;
  } else {
    reportTest('Sync from Metakocka', 'failed', result.error || `Status: ${result.status}`);
    return null;
  }
}

// Test function to sync all unsynced orders from Metakocka
async function syncAllOrdersFromMetakocka() {
  console.log('\n🧪 TEST 9: Syncing all unsynced orders from Metakocka...');
  
  const result = await makeRequest('/integrations/metakocka/orders/sync-all-from', 'POST');
  
  if (result.status === 200 && result.data && result.data.success) {
    reportTest('Sync All from Metakocka', 'passed');
    return result.data.syncedCount || 0;
  } else {
    reportTest('Sync All from Metakocka', 'failed', result.error || `Status: ${result.status}`);
    return 0;
  }
}

// Main function to run the tests
async function runTests() {
  console.log('🚀 Starting Metakocka Order Management Integration Tests');
  console.log('=====================================================');
  
  // Validate required environment variables
  if (!AUTH_TOKEN || AUTH_TOKEN === 'test_token') {
    console.error('❌ ERROR: Valid AUTH_TOKEN is required. Please set it in the .env file.');
    return;
  }
  
  // Step 1: Create a test order or use provided ORDER_ID
  const orderId = await createTestOrder();
  
  // Step 2: Sync the order to Metakocka
  let metakockaId = null;
  if (orderId) {
    metakockaId = await syncOrderToMetakocka(orderId);
  }
  
  // Step 3: Get the sync status
  if (orderId) {
    await getOrderSyncStatus(orderId);
  }
  
  // Step 4: Update order status to confirmed
  if (orderId && metakockaId) {
    await updateOrderStatus(orderId, 'confirmed');
  }
  
  // Step 5: Update order status to processing
  if (orderId && metakockaId) {
    await updateOrderStatus(orderId, 'processing');
  }
  
  // Step 6: Fulfill the order
  let fulfilled = false;
  if (orderId && metakockaId) {
    fulfilled = await fulfillOrder(orderId);
  }
  
  // Step 7: Cancel the order (skip if already fulfilled)
  if (orderId && metakockaId && !fulfilled) {
    await cancelOrder(orderId);
  } else if (fulfilled) {
    reportTest('Cancel Order', 'skipped', 'Order already fulfilled');
  }
  
  // Step 8: Get unsynced orders from Metakocka
  await getUnsyncedOrdersFromMetakocka();
  
  // Step 9: Sync a specific order from Metakocka (if METAKOCKA_ID is provided)
  if (METAKOCKA_ID) {
    await syncOrderFromMetakocka(METAKOCKA_ID);
  } else {
    reportTest('Sync from Metakocka', 'skipped', 'No METAKOCKA_ID provided');
  }
  
  // Step 10: Sync all unsynced orders from Metakocka
  await syncAllOrdersFromMetakocka();
  
  // Print test summary
  console.log('\n=====================================================');
  console.log('📊 Test Summary');
  console.log('=====================================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} (${Math.round(testResults.passed / testResults.total * 100)}%)`);
  console.log(`Failed: ${testResults.failed} (${Math.round(testResults.failed / testResults.total * 100)}%)`);
  console.log(`Skipped: ${testResults.skipped} (${Math.round(testResults.skipped / testResults.total * 100)}%)`);
  console.log('=====================================================');
  
  if (orderId) console.log(`Order ID: ${orderId}`);
  if (metakockaId) console.log(`Metakocka ID: ${metakockaId}`);
  console.log('=====================================================');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Unhandled error during test execution:', error);
});
