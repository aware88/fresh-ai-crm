/**
 * Manual test script for Metakocka Order Management Integration
 * 
 * This script tests the following functionality:
 * 1. Creating a test order
 * 2. Syncing order to Metakocka
 * 3. Getting order sync status
 * 4. Updating order status
 * 5. Fulfilling order
 * 6. Cancelling order
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
const DEBUG = env.DEBUG === 'true';

if (DEBUG) {
  console.log('🔍 DEBUG: Using API base URL:', API_BASE_URL);
  console.log('🔍 DEBUG: Using auth token:', AUTH_TOKEN.substring(0, 5) + '...');
}

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
  
  console.log(`Making ${method} request to ${url}`);
  if (body) console.log('Request body:', JSON.stringify(body, null, 2));
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { status: 500, error: error.message };
  }
}

// Test function to create a test order
async function createTestOrder() {
  console.log('\n🧪 Creating test order...');
  
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
    console.log('✅ Test order created successfully');
    return result.data.id;
  } else {
    console.log('❌ Failed to create test order');
    return null;
  }
}

// Test function to sync an order to Metakocka
async function syncOrderToMetakocka(orderId) {
  console.log(`\n🧪 Syncing order ${orderId} to Metakocka...`);
  
  const result = await makeRequest('/integrations/metakocka/orders/sync', 'POST', { orderId });
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Order synced successfully');
    return result.data.metakockaId;
  } else {
    console.log('❌ Failed to sync order');
    return null;
  }
}

// Test function to get order sync status
async function getOrderSyncStatus(orderId) {
  console.log(`\n🧪 Getting sync status for order ${orderId}...`);
  
  const result = await makeRequest(`/integrations/metakocka/orders/sync?orderId=${orderId}`, 'GET');
  
  if (result.status === 200) {
    console.log('✅ Got sync status successfully');
    return result.data;
  } else {
    console.log('❌ Failed to get sync status');
    return null;
  }
}

// Test function to update order status
async function updateOrderStatus(orderId, status) {
  console.log(`\n🧪 Updating order ${orderId} status to ${status}...`);
  
  const result = await makeRequest('/integrations/metakocka/orders/status', 'POST', { orderId, status });
  
  if (result.status === 200 && result.data.success) {
    console.log(`✅ Order status updated to ${status} successfully`);
    return true;
  } else {
    console.log(`❌ Failed to update order status to ${status}`);
    return false;
  }
}

// Test function to fulfill an order
async function fulfillOrder(orderId) {
  console.log(`\n🧪 Fulfilling order ${orderId}...`);
  
  const fulfillmentData = {
    tracking_number: 'TRACK123456',
    shipping_carrier: 'Test Carrier',
    notes: 'Test fulfillment',
    fulfillment_date: new Date().toISOString().split('T')[0]
  };
  
  const result = await makeRequest('/integrations/metakocka/orders/fulfill', 'POST', { orderId, fulfillmentData });
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Order fulfilled successfully');
    return true;
  } else {
    console.log('❌ Failed to fulfill order');
    return false;
  }
}

// Test function to cancel an order
async function cancelOrder(orderId) {
  console.log(`\n🧪 Cancelling order ${orderId}...`);
  
  const cancellationReason = 'Test cancellation';
  
  const result = await makeRequest('/integrations/metakocka/orders/cancel', 'POST', { orderId, cancellationReason });
  
  if (result.status === 200 && result.data.success) {
    console.log('✅ Order cancelled successfully');
    return true;
  } else {
    console.log('❌ Failed to cancel order');
    return false;
  }
}

// Main function to run the tests
async function runTests() {
  console.log('🚀 Starting Manual Metakocka Order Management Tests');
  console.log('=====================================================');
  
  // Step 1: Create a test order
  const orderId = await createTestOrder();
  if (!orderId) {
    console.log('❌ Cannot continue tests without a valid order ID');
    return;
  }
  
  // Step 2: Sync the order to Metakocka
  const metakockaId = await syncOrderToMetakocka(orderId);
  if (!metakockaId) {
    console.log('❌ Cannot continue tests without successful sync');
    return;
  }
  
  // Step 3: Get the sync status
  const syncStatus = await getOrderSyncStatus(orderId);
  if (!syncStatus) {
    console.log('❌ Failed to get sync status');
  }
  
  // Step 4: Update order status to confirmed
  const confirmedStatus = await updateOrderStatus(orderId, 'confirmed');
  if (!confirmedStatus) {
    console.log('❌ Failed to update order status to confirmed');
  }
  
  // Step 5: Update order status to processing
  const processingStatus = await updateOrderStatus(orderId, 'processing');
  if (!processingStatus) {
    console.log('❌ Failed to update order status to processing');
  }
  
  // Step 6: Fulfill the order
  const fulfilled = await fulfillOrder(orderId);
  if (!fulfilled) {
    console.log('❌ Failed to fulfill order');
  }
  
  // Step 7: Cancel the order (optional, since it's already fulfilled)
  console.log('\n⚠️ Note: Cancellation test is skipped as the order is already fulfilled');
  console.log('To test cancellation, comment out the fulfillment step and uncomment the line below');
  // await cancelOrder(orderId);
  
  console.log('\n=====================================================');
  console.log('📊 Manual Test Summary');
  console.log('=====================================================');
  console.log(`Order ID: ${orderId}`);
  console.log(`Metakocka ID: ${metakockaId}`);
  console.log('=====================================================');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Unhandled error during test execution:', error);
});
