require('dotenv').config();
const { execSync } = require('child_process');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('Error: AUTH_TOKEN environment variable is required');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

// Test results tracking
const testResults = [];

// Utility functions
async function runTest(name, testFn) {
  console.log(`\n=== ${name} ===`);
  try {
    await testFn();
    console.log(`✅ ${name} - PASSED`);
    testResults.push({ name, passed: true });
  } catch (error) {
    console.error(`❌ ${name} - FAILED`);
    console.error('Error:', error.message);
    testResults.push({ 
      name, 
      passed: false, 
      error: error.message 
    });
  }
}

// Test 1: Sync inventory for all products
async function testSyncInventory() {
  const response = await fetch(`${API_BASE_URL}/api/integrations/metakocka/inventory/sync`, {
    method: 'POST',
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to sync inventory: ${data.message || 'Unknown error'}`);
  }

  console.log('Sync result:', data);
  
  if (data.success !== true) {
    throw new Error(`Sync was not successful: ${data.message}`);
  }
  
  console.log(`Synced ${data.syncedCount} products`);
  
  if (data.errorCount > 0) {
    console.warn(`Warning: ${data.errorCount} errors occurred during sync`);
    console.warn('Errors:', data.errors);
  }
}

// Test 2: Get inventory for all products after sync
async function testGetInventoryAfterSync() {
  const response = await fetch(`${API_BASE_URL}/api/integrations/metakocka/inventory`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get inventory: ${data.message || 'Unknown error'}`);
  }

  console.log(`Retrieved inventory for ${data.length} products`);
  
  if (data.length === 0) {
    console.warn('Warning: No inventory data found. Make sure you have products synced with Metakocka.');
  } else {
    // Log first few items as sample
    console.log('Sample inventory items:', data.slice(0, 3));
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting Metakocka Inventory Sync Tests\n');
  
  await runTest('1. Sync Inventory from Metakocka', testSyncInventory);
  await runTest('2. Verify Inventory Data', testGetInventoryAfterSync);
  
  // Print summary
  console.log('\n=== Test Summary ===');
  testResults.forEach((result, index) => {
    console.log(
      `${index + 1}. ${result.name}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`
    );
    if (!result.passed) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passedCount = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  
  console.log(`\n${passedCount} of ${totalTests} tests passed`);
  process.exit(passedCount === totalTests ? 0 : 1);
}

// Execute tests
runAllTests().catch(error => {
  console.error('Unhandled error in test execution:', error);
  process.exit(1);
});
