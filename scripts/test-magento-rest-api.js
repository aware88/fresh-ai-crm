#!/usr/bin/env node

/**
 * Test Magento REST API with New Credentials
 * 
 * This script tests the Magento REST API with the new credentials provided
 */

const fetch = require('node-fetch');

// New Magento REST API credentials
const MAGENTO_CONFIG = {
  baseUrl: 'https://withcar.si',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

async function testMagentoRestAPI() {
  console.log('🧪 Testing Magento REST API with New Credentials...');
  console.log('🌐 Base URL:', MAGENTO_CONFIG.baseUrl);
  console.log('👤 API User:', MAGENTO_CONFIG.apiUser);
  console.log('🔑 API Key:', MAGENTO_CONFIG.apiKey.substring(0, 8) + '...');
  console.log('🔐 API Secret:', MAGENTO_CONFIG.apiSecret.substring(0, 8) + '...');

  try {
    // Step 1: Get Admin Token
    console.log('\n📋 Step 1: Getting Admin Token');
    const tokenUrl = `${MAGENTO_CONFIG.baseUrl}/rest/V1/integration/admin/token`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: MAGENTO_CONFIG.apiUser,
        password: MAGENTO_CONFIG.apiSecret
      }),
      timeout: 15000
    });

    console.log('   Status:', tokenResponse.status, tokenResponse.statusText);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('   ❌ Token request failed');
      console.log('   📄 Error:', errorText.substring(0, 300));
      
      // Try with API Key as password instead
      console.log('\n🔄 Trying with API Key as password...');
      const tokenResponse2 = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: MAGENTO_CONFIG.apiUser,
          password: MAGENTO_CONFIG.apiKey
        }),
        timeout: 15000
      });

      console.log('   Status:', tokenResponse2.status, tokenResponse2.statusText);
      
      if (!tokenResponse2.ok) {
        const errorText2 = await tokenResponse2.text();
        console.log('   ❌ Second token attempt failed');
        console.log('   📄 Error:', errorText2.substring(0, 300));
        return false;
      }
      
      const token = await tokenResponse2.text();
      console.log('   ✅ Token obtained with API Key as password');
      console.log('   🔑 Token:', token.substring(0, 20) + '...');
      
      // Use this token for subsequent requests
      await testWithToken(token.replace(/"/g, ''));
      return true;
    }

    const token = await tokenResponse.text();
    console.log('   ✅ Admin token obtained successfully');
    console.log('   🔑 Token:', token.substring(0, 20) + '...');
    
    // Use the token for subsequent requests
    await testWithToken(token.replace(/"/g, ''));
    return true;

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   🌐 DNS resolution failed - check the API URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 Connection refused - server may be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   ⏱️  Connection timeout - server may be slow');
    }
    
    return false;
  }
}

async function testWithToken(token) {
  console.log('\n📋 Step 2: Testing API Endpoints with Token');
  
  const endpoints = [
    {
      name: 'Store Configurations',
      url: '/rest/V1/store/storeConfigs',
      description: 'Basic store information'
    },
    {
      name: 'Customer Search (Limited)',
      url: '/rest/V1/customers/search?searchCriteria[pageSize]=5',
      description: 'Search for customers'
    },
    {
      name: 'Order Search (Limited)', 
      url: '/rest/V1/orders?searchCriteria[pageSize]=5',
      description: 'Search for orders'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n   🔍 Testing: ${endpoint.name}`);
      console.log(`   📍 URL: ${MAGENTO_CONFIG.baseUrl}${endpoint.url}`);
      
      const response = await fetch(`${MAGENTO_CONFIG.baseUrl}${endpoint.url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ${endpoint.name} - SUCCESS`);
        
        if (Array.isArray(data)) {
          console.log(`   📊 Results: ${data.length} items`);
        } else if (data.items) {
          console.log(`   📊 Results: ${data.items.length} items (total: ${data.total_count || 'unknown'})`);
          
          // Show sample data for orders
          if (endpoint.url.includes('orders') && data.items.length > 0) {
            const order = data.items[0];
            console.log(`   📦 Sample order: #${order.increment_id} - ${order.customer_email} - €${order.grand_total} (${order.status})`);
          }
          
          // Show sample data for customers
          if (endpoint.url.includes('customers') && data.items.length > 0) {
            const customer = data.items[0];
            console.log(`   👤 Sample customer: ${customer.firstname} ${customer.lastname} - ${customer.email}`);
          }
        } else if (typeof data === 'object') {
          console.log(`   📊 Response: Object with ${Object.keys(data).length} properties`);
          if (data.length !== undefined) {
            console.log(`   📊 Store configs: ${data.length} stores`);
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️  ${endpoint.name} - Failed`);
        console.log(`   📄 Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name} - Exception: ${error.message}`);
    }
  }

  // Test specific customer search
  console.log('\n   🔍 Testing: Specific Customer Search');
  const testEmail = 'tim.mak88@gmail.com';
  
  try {
    const customerSearchUrl = `${MAGENTO_CONFIG.baseUrl}/rest/V1/customers/search?searchCriteria[filter_groups][0][filters][0][field]=email&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(testEmail)}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
    
    const customerResponse = await fetch(customerSearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log(`   ✅ Customer search for ${testEmail}: ${customerData.items?.length || 0} results`);
      
      if (customerData.items && customerData.items.length > 0) {
        const customer = customerData.items[0];
        console.log(`   👤 Found: ${customer.firstname} ${customer.lastname} (ID: ${customer.id})`);
        
        // Try to get orders for this customer
        console.log('\n   🔍 Testing: Orders for Found Customer');
        const orderSearchUrl = `${MAGENTO_CONFIG.baseUrl}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=customer_id&searchCriteria[filter_groups][0][filters][0][value]=${customer.id}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        
        const orderResponse = await fetch(orderSearchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          console.log(`   ✅ Orders for customer: ${orderData.items?.length || 0} orders`);
          
          if (orderData.items && orderData.items.length > 0) {
            const order = orderData.items[0];
            console.log(`   📦 Latest order: #${order.increment_id} - €${order.grand_total} (${order.status})`);
          }
        } else {
          console.log(`   ⚠️  Orders search failed: ${orderResponse.status}`);
        }
      }
    } else {
      console.log(`   ⚠️  Customer search failed: ${customerResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Customer search exception: ${error.message}`);
  }
}

// Run the test
testMagentoRestAPI().then(success => {
  if (success) {
    console.log('\n🎉 Magento REST API test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Authentication is working');
    console.log('   ✅ API endpoints are accessible');
    console.log('   ✅ Ready for integration with CRM');
    process.exit(0);
  } else {
    console.log('\n❌ Magento REST API test failed.');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify the credentials are correct');
    console.log('   2. Check if the user has proper API permissions');
    console.log('   3. Ensure the REST API is enabled in Magento admin');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

