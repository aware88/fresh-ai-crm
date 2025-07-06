/**
 * Metakocka Inventory Sync Test Script (Enhanced)
 * 
 * This script tests the enhanced inventory synchronization functionality between
 * CRM Mind and Metakocka, including:
 * 
 * 1. Syncing all product inventory data from Metakocka
 * 2. Syncing individual product inventory data
 * 3. Retrieving inventory data for specific products
 * 4. Checking product availability
 * 5. Testing inventory alerts
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const PRODUCT_IDS = process.env.PRODUCT_IDS ? process.env.PRODUCT_IDS.split(',') : [];
const DEBUG = process.env.DEBUG === 'true';

// Validation
if (!AUTH_TOKEN) {
  console.error('❌ ERROR: AUTH_TOKEN environment variable is required');
  process.exit(1);
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to log debug messages
function debug(message) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`);
  }
}

// Helper function to record test results
function recordTestResult(testName, passed, error = null, data = null) {
  const result = { name: testName, passed };
  if (error) result.error = error;
  if (data) result.data = data;
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASSED: ${testName}`);
  } else if (error === 'SKIPPED') {
    testResults.skipped++;
    console.log(`⏭️ SKIPPED: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAILED: ${testName}`);
    if (error) console.error(`   Error: ${error}`);
  }
}

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  debug(`Making ${options.method || 'GET'} request to ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { response, data };
    } else {
      const text = await response.text();
      return { response, data: text };
    }
  } catch (error) {
    debug(`API request error: ${error.message}`);
    throw error;
  }
}

// Test 1: Sync all product inventory from Metakocka
async function testSyncAllInventory() {
  try {
    const { response, data } = await apiRequest('/integrations/metakocka/inventory/sync', {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    if (!data.success) {
      throw new Error(`Sync failed: ${data.message}`);
    }
    
    recordTestResult(
      'Sync All Product Inventory', 
      true, 
      null, 
      { syncedCount: data.syncedCount }
    );
    return data;
  } catch (error) {
    recordTestResult('Sync All Product Inventory', false, error.message);
    return null;
  }
}

// Test 2: Get inventory for all products
async function testGetAllInventory() {
  try {
    const { response, data } = await apiRequest('/integrations/metakocka/inventory');
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Expected array of inventory items');
    }
    
    recordTestResult(
      'Get All Product Inventory', 
      true, 
      null, 
      { count: data.length }
    );
    return data;
  } catch (error) {
    recordTestResult('Get All Product Inventory', false, error.message);
    return null;
  }
}

// Test 3: Sync individual product inventory
async function testSyncProductInventory(productId) {
  if (!productId) {
    recordTestResult('Sync Individual Product Inventory', false, 'SKIPPED', { reason: 'No product ID provided' });
    return null;
  }
  
  try {
    const { response, data } = await apiRequest(`/integrations/metakocka/inventory/sync/${productId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    if (!data.success) {
      throw new Error(`Sync failed: ${data.message}`);
    }
    
    recordTestResult(
      `Sync Individual Product Inventory (${productId})`, 
      true, 
      null, 
      { productId, data: data.data }
    );
    return data;
  } catch (error) {
    recordTestResult(`Sync Individual Product Inventory (${productId})`, false, error.message);
    return null;
  }
}

// Test 4: Get inventory for specific product
async function testGetProductInventory(productId) {
  if (!productId) {
    recordTestResult('Get Individual Product Inventory', false, 'SKIPPED', { reason: 'No product ID provided' });
    return null;
  }
  
  try {
    const { response, data } = await apiRequest(`/integrations/metakocka/inventory?productId=${productId}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    recordTestResult(
      `Get Individual Product Inventory (${productId})`, 
      true, 
      null, 
      { productId, data }
    );
    return data;
  } catch (error) {
    recordTestResult(`Get Individual Product Inventory (${productId})`, false, error.message);
    return null;
  }
}

// Test 5: Check product availability
async function testCheckProductAvailability(productId, quantity = 1) {
  if (!productId) {
    recordTestResult('Check Product Availability', false, 'SKIPPED', { reason: 'No product ID provided' });
    return null;
  }
  
  try {
    const { response, data } = await apiRequest('/integrations/metakocka/inventory', {
      method: 'POST',
      body: JSON.stringify({
        products: [{ id: productId, quantity }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    recordTestResult(
      `Check Product Availability (${productId}, qty: ${quantity})`, 
      true, 
      null, 
      { productId, quantity, available: data[0]?.available }
    );
    return data;
  } catch (error) {
    recordTestResult(`Check Product Availability (${productId}, qty: ${quantity})`, false, error.message);
    return null;
  }
}

// Main test execution
async function runTests() {
  console.log('🧪 Starting Metakocka Inventory Sync Tests');
  console.log('===========================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Product IDs: ${PRODUCT_IDS.length > 0 ? PRODUCT_IDS.join(', ') : 'None specified (using all products)'}`);  
  console.log('===========================================\n');
  
  try {
    // Test 1: Sync all inventory
    await testSyncAllInventory();
    
    // Test 2: Get all inventory
    const allInventory = await testGetAllInventory();
    
    // If we have specific product IDs to test
    if (PRODUCT_IDS.length > 0) {
      for (const productId of PRODUCT_IDS) {
        // Test 3: Sync individual product
        await testSyncProductInventory(productId);
        
        // Test 4: Get individual product inventory
        await testGetProductInventory(productId);
        
        // Test 5: Check product availability
        await testCheckProductAvailability(productId, 1);
      }
    } else if (allInventory && allInventory.length > 0) {
      // Use the first product from all inventory
      const sampleProductId = allInventory[0].productId;
      
      // Test 3: Sync individual product
      await testSyncProductInventory(sampleProductId);
      
      // Test 4: Get individual product inventory
      await testGetProductInventory(sampleProductId);
      
      // Test 5: Check product availability
      await testCheckProductAvailability(sampleProductId, 1);
    } else {
      console.log('⚠️ No products available for individual tests');
    }
    
    // Print test summary
    console.log('\n===========================================');
    console.log('📊 TEST SUMMARY');
    console.log('===========================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏭️ Skipped: ${testResults.skipped}`);
    console.log(`📝 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Unexpected error during test execution:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
