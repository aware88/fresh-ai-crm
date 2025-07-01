/**
 * Metakocka Order Dashboard Test Script
 * 
 * This script tests the functionality of the OrderDashboard component
 * including order fetching, filtering, and syncing operations.
 */

require('dotenv').config();
const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error(chalk.red('Error: AUTH_TOKEN is required. Please set it in your .env file'));
  process.exit(1);
}

// Headers for API requests
const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test functions
async function fetchOrders() {
  console.log(chalk.blue('\n📋 Fetching orders...'));
  
  try {
    const response = await fetch(`${BASE_URL}/api/sales-documents?type=order`, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }
    
    const orders = await response.json();
    console.log(chalk.green(`✓ Successfully fetched ${orders.length} orders`));
    
    if (orders.length > 0) {
      console.log(chalk.gray(`  First order: ${orders[0].document_number} - ${orders[0].customer_name}`));
    }
    
    return orders;
  } catch (error) {
    console.error(chalk.red(`✗ Error fetching orders: ${error.message}`));
    return [];
  }
}

async function getSyncStatus(orderIds) {
  console.log(chalk.blue('\n🔄 Getting order sync status...'));
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/metakocka/orders/sync/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderIds })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get sync status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(chalk.green(`✓ Successfully retrieved sync status for ${result.mappings?.length || 0} orders`));
    return result;
  } catch (error) {
    console.error(chalk.red(`✗ Error getting sync status: ${error.message}`));
    return { mappings: [] };
  }
}

async function syncOrder(orderId) {
  console.log(chalk.blue(`\n🔄 Syncing order ${orderId}...`));
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/metakocka/orders/sync/${orderId}`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync order: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(chalk.green(`✓ Successfully synced order: ${result.success ? 'Success' : 'Failed'}`));
    return result;
  } catch (error) {
    console.error(chalk.red(`✗ Error syncing order: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function syncMultipleOrders(orderIds) {
  console.log(chalk.blue(`\n🔄 Syncing ${orderIds.length} orders...`));
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/metakocka/orders/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderIds })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync orders: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(chalk.green(`✓ Successfully synced orders: Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`));
    return result;
  } catch (error) {
    console.error(chalk.red(`✗ Error syncing orders: ${error.message}`));
    return { success: false, error: error.message };
  }
}

async function syncOrdersFromMetakocka() {
  console.log(chalk.blue('\n📥 Syncing orders from Metakocka...'));
  
  try {
    const response = await fetch(`${BASE_URL}/api/integrations/metakocka/orders/sync-from-metakocka`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync orders from Metakocka: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(chalk.green(`✓ Successfully synced ${result.imported} orders from Metakocka`));
    return result;
  } catch (error) {
    console.error(chalk.red(`✗ Error syncing orders from Metakocka: ${error.message}`));
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log(chalk.yellow('=== Metakocka Order Dashboard Tests ==='));
  
  // Test 1: Fetch orders
  const orders = await fetchOrders();
  
  if (orders.length === 0) {
    console.log(chalk.yellow('No orders found. Skipping remaining tests.'));
    return;
  }
  
  // Test 2: Get sync status for orders
  const orderIds = orders.slice(0, 5).map(order => order.id);
  await getSyncStatus(orderIds);
  
  // Test 3: Sync a single order
  if (orderIds.length > 0) {
    await syncOrder(orderIds[0]);
  }
  
  // Test 4: Sync multiple orders
  if (orderIds.length > 1) {
    await syncMultipleOrders(orderIds.slice(0, 3));
  }
  
  // Test 5: Sync orders from Metakocka
  await syncOrdersFromMetakocka();
  
  console.log(chalk.yellow('\n=== All tests completed ==='));
}

// Run the tests
runTests().catch(error => {
  console.error(chalk.red(`Unhandled error: ${error.message}`));
  process.exit(1);
});
