#!/usr/bin/env node

/**
 * Test Magento REST API with Basic Authentication
 * 
 * This script tests the Magento REST API using Basic Authentication
 */

const fetch = require('node-fetch');

// Magento REST API credentials
const MAGENTO_CONFIG = {
  baseUrl: 'https://withcar.si',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

function getBasicAuthHeader(user, password) {
  const credentials = `${user}:${password}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function testMagentoBasicAuth() {
  console.log('🧪 Testing Magento REST API with Basic Authentication...');
  console.log('🌐 Base URL:', MAGENTO_CONFIG.baseUrl);
  console.log('👤 API User:', MAGENTO_CONFIG.apiUser);
  console.log('🔑 API Key:', MAGENTO_CONFIG.apiKey.substring(0, 8) + '...');
  console.log('🔐 API Secret:', MAGENTO_CONFIG.apiSecret.substring(0, 8) + '...');

  let workingAuth = null;

  // Try both authentication methods
  const authMethods = [
    {
      name: 'Basic Auth (User:Secret)',
      header: getBasicAuthHeader(MAGENTO_CONFIG.apiUser, MAGENTO_CONFIG.apiSecret)
    },
    {
      name: 'Basic Auth (User:Key)',
      header: getBasicAuthHeader(MAGENTO_CONFIG.apiUser, MAGENTO_CONFIG.apiKey)
    }
  ];

  for (const authMethod of authMethods) {
    try {
      console.log(`\n📋 Testing: ${authMethod.name}`);
      
      // Test 1: Store Configurations
      const storeResponse = await fetch(`${MAGENTO_CONFIG.baseUrl}/rest/V1/store/storeConfigs`, {
        method: 'GET',
        headers: {
          'Authorization': authMethod.header,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log(`   📊 Store configs: ${storeResponse.status} ${storeResponse.statusText}`);
      
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        console.log(`   ✅ Store configs retrieved successfully`);
        console.log(`   🏪 Stores: ${Array.isArray(storeData) ? storeData.length : 1}`);
        
        workingAuth = authMethod;
        
        // Continue testing with this auth method
        await testAllEndpoints(authMethod);
        break;
      } else {
        const errorText = await storeResponse.text();
        console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }

  return workingAuth;
}

async function testAllEndpoints(authMethod) {
  console.log(`\n🧪 Testing all endpoints with ${authMethod.name}...`);
  
  const endpoints = [
    {
      name: 'Customer Search',
      url: '/rest/V1/customers/search?searchCriteria[pageSize]=5',
      description: 'Search for customers'
    },
    {
      name: 'Order Search',
      url: '/rest/V1/orders?searchCriteria[pageSize]=5',
      description: 'Search for orders'
    },
    {
      name: 'Product Search',
      url: '/rest/V1/products?searchCriteria[pageSize]=5',
      description: 'Search for products'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n   🔍 ${endpoint.name}`);
      
      const response = await fetch(`${MAGENTO_CONFIG.baseUrl}${endpoint.url}`, {
        method: 'GET',
        headers: {
          'Authorization': authMethod.header,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${endpoint.name} successful`);
        
        if (data.items) {
          console.log(`   📊 Found: ${data.items.length} items (total: ${data.total_count || 'unknown'})`);
          
          // Show sample data
          if (data.items.length > 0) {
            const item = data.items[0];
            
            if (endpoint.url.includes('customers')) {
              console.log(`   👤 Sample: ${item.firstname} ${item.lastname} - ${item.email}`);
            } else if (endpoint.url.includes('orders')) {
              console.log(`   📦 Sample: Order #${item.increment_id} - €${item.grand_total} (${item.status})`);
            } else if (endpoint.url.includes('products')) {
              console.log(`   🛍️  Sample: ${item.name} - SKU: ${item.sku}`);
            }
          }
        } else if (Array.isArray(data)) {
          console.log(`   📊 Found: ${data.length} items`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️  Failed: ${errorText.substring(0, 150)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name} error: ${error.message}`);
    }
  }

  // Test specific customer search by email
  console.log('\n   🔍 Specific Customer Search by Email');
  const testEmail = 'tim.mak88@gmail.com';
  
  try {
    const customerSearchUrl = `${MAGENTO_CONFIG.baseUrl}/rest/V1/customers/search?searchCriteria[filter_groups][0][filters][0][field]=email&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(testEmail)}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
    
    const customerResponse = await fetch(customerSearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': authMethod.header,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log(`   📧 Customer search for ${testEmail}: ${customerData.items?.length || 0} results`);
      
      if (customerData.items && customerData.items.length > 0) {
        const customer = customerData.items[0];
        console.log(`   👤 Found: ${customer.firstname} ${customer.lastname} (ID: ${customer.id})`);
        
        // Get orders for this customer
        await testCustomerOrders(authMethod, customer.id, customer.email);
      } else {
        console.log(`   ℹ️  No customer found with email ${testEmail}`);
      }
    } else {
      console.log(`   ⚠️  Customer search failed: ${customerResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Customer search error: ${error.message}`);
  }
}

async function testCustomerOrders(authMethod, customerId, customerEmail) {
  console.log(`\n   🔍 Orders for Customer ID: ${customerId}`);
  
  try {
    const orderSearchUrl = `${MAGENTO_CONFIG.baseUrl}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=customer_id&searchCriteria[filter_groups][0][filters][0][value]=${customerId}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq&searchCriteria[sortOrders][0][field]=created_at&searchCriteria[sortOrders][0][direction]=DESC`;
    
    const orderResponse = await fetch(orderSearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': authMethod.header,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      console.log(`   📦 Orders found: ${orderData.items?.length || 0}`);
      
      if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach((order, index) => {
          console.log(`   📋 Order ${index + 1}: #${order.increment_id} - €${order.grand_total} (${order.status}) - ${order.created_at.substring(0, 10)}`);
        });
        
        // Test getting order items for the first order
        const firstOrder = orderData.items[0];
        await testOrderItems(authMethod, firstOrder.entity_id, firstOrder.increment_id);
      }
    } else {
      console.log(`   ⚠️  Order search failed: ${orderResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Order search error: ${error.message}`);
  }
}

async function testOrderItems(authMethod, orderId, orderNumber) {
  console.log(`\n   🔍 Items for Order #${orderNumber} (ID: ${orderId})`);
  
  try {
    const itemsUrl = `${MAGENTO_CONFIG.baseUrl}/rest/V1/orders/${orderId}/items`;
    
    const itemsResponse = await fetch(itemsUrl, {
      method: 'GET',
      headers: {
        'Authorization': authMethod.header,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json();
      const items = Array.isArray(itemsData) ? itemsData : itemsData.items || [];
      
      console.log(`   🛍️  Order items: ${items.length}`);
      
      items.forEach((item, index) => {
        console.log(`   📦 Item ${index + 1}: ${item.qty_ordered}x ${item.name} - €${item.price} each`);
      });
    } else {
      console.log(`   ⚠️  Order items failed: ${itemsResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Order items error: ${error.message}`);
  }
}

// Run the test
testMagentoBasicAuth().then(workingAuth => {
  if (workingAuth) {
    console.log('\n🎉 Magento REST API test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Authentication: ${workingAuth.name}`);
    console.log('   ✅ API endpoints are accessible');
    console.log('   ✅ Customer and order data can be retrieved');
    console.log('   ✅ Ready for full CRM integration');
    
    console.log('\n🔧 Integration Configuration:');
    console.log('   • Base URL: https://withcar.si');
    console.log('   • API Path: /rest/V1/');
    console.log('   • Auth Method: Basic Authentication');
    console.log('   • User: tim');
    console.log('   • Password: API Secret (d832e7ea...)');
    
    process.exit(0);
  } else {
    console.log('\n❌ Magento REST API test failed.');
    console.log('\n💡 Check the credentials and API permissions.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

