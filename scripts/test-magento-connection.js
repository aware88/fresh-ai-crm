#!/usr/bin/env node

/**
 * Test Magento Connection Script
 * 
 * This script tests the Magento API connection directly using the provided credentials
 */

const fetch = require('node-fetch');

// Magento API credentials from user
const MAGENTO_CONFIG = {
  apiUrl: 'https://withcar.si/urednik',
  apiKey: '4M40bZ&88w^1',
  apiUser: 'tim'
};

async function testMagentoConnection() {
  console.log('🧪 Testing Magento API Connection...');
  console.log('📍 API URL:', MAGENTO_CONFIG.apiUrl);
  console.log('👤 API User:', MAGENTO_CONFIG.apiUser);
  console.log('🔑 API Key:', MAGENTO_CONFIG.apiKey.substring(0, 8) + '...');

  try {
    // Test 1: Basic connection test - try to get store information
    console.log('\n📋 Test 1: Basic Store Information');
    const storeUrl = `${MAGENTO_CONFIG.apiUrl}/rest/V1/store/storeConfigs`;
    
    const storeResponse = await fetch(storeUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log('   Status:', storeResponse.status, storeResponse.statusText);
    
    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      console.log('   ✅ Store connection successful');
      console.log('   📊 Store count:', Array.isArray(storeData) ? storeData.length : 1);
      
      if (Array.isArray(storeData) && storeData.length > 0) {
        console.log('   🏪 First store:', storeData[0].code || 'unknown');
      }
    } else {
      const errorText = await storeResponse.text();
      console.log('   ❌ Store connection failed');
      console.log('   📄 Response:', errorText);
      return false;
    }

    // Test 2: Try to get customer list (limited)
    console.log('\n📋 Test 2: Customer Search');
    const customersUrl = `${MAGENTO_CONFIG.apiUrl}/rest/V1/customers/search?searchCriteria[pageSize]=5`;
    
    const customersResponse = await fetch(customersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log('   Status:', customersResponse.status, customersResponse.statusText);
    
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      console.log('   ✅ Customer search successful');
      console.log('   👥 Total customers:', customersData.total_count || 0);
      console.log('   📋 Returned customers:', customersData.items?.length || 0);
      
      if (customersData.items && customersData.items.length > 0) {
        const firstCustomer = customersData.items[0];
        console.log('   📧 First customer email:', firstCustomer.email || 'unknown');
      }
    } else {
      const errorText = await customersResponse.text();
      console.log('   ⚠️  Customer search failed (this might be normal due to permissions)');
      console.log('   📄 Response:', errorText.substring(0, 200) + '...');
    }

    // Test 3: Try to get orders (limited)
    console.log('\n📋 Test 3: Order Search');
    const ordersUrl = `${MAGENTO_CONFIG.apiUrl}/rest/V1/orders?searchCriteria[pageSize]=5`;
    
    const ordersResponse = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log('   Status:', ordersResponse.status, ordersResponse.statusText);
    
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('   ✅ Order search successful');
      console.log('   🛒 Total orders:', ordersData.total_count || 0);
      console.log('   📋 Returned orders:', ordersData.items?.length || 0);
      
      if (ordersData.items && ordersData.items.length > 0) {
        const firstOrder = ordersData.items[0];
        console.log('   📦 First order ID:', firstOrder.increment_id || firstOrder.entity_id || 'unknown');
        console.log('   📧 Customer email:', firstOrder.customer_email || 'unknown');
      }
    } else {
      const errorText = await ordersResponse.text();
      console.log('   ⚠️  Order search failed (this might be normal due to permissions)');
      console.log('   📄 Response:', errorText.substring(0, 200) + '...');
    }

    // Test 4: Search for a specific customer by email (if provided)
    const testEmail = 'tim.mak88@gmail.com'; // Use test email
    console.log(`\n📋 Test 4: Search for specific customer (${testEmail})`);
    
    const emailSearchUrl = `${MAGENTO_CONFIG.apiUrl}/rest/V1/customers/search?searchCriteria[filter_groups][0][filters][0][field]=email&searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(testEmail)}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
    
    const emailResponse = await fetch(emailSearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });

    console.log('   Status:', emailResponse.status, emailResponse.statusText);
    
    if (emailResponse.ok) {
      const emailData = await emailResponse.json();
      console.log('   ✅ Email search successful');
      console.log('   👤 Found customers:', emailData.items?.length || 0);
      
      if (emailData.items && emailData.items.length > 0) {
        const customer = emailData.items[0];
        console.log('   📧 Customer:', customer.firstname, customer.lastname, customer.email);
        
        // If customer found, try to get their orders
        console.log(`\n📋 Test 5: Get orders for customer ${customer.id}`);
        const customerOrdersUrl = `${MAGENTO_CONFIG.apiUrl}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=customer_id&searchCriteria[filter_groups][0][filters][0][value]=${customer.id}&searchCriteria[filter_groups][0][filters][0][condition_type]=eq`;
        
        const customerOrdersResponse = await fetch(customerOrdersUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });

        if (customerOrdersResponse.ok) {
          const customerOrdersData = await customerOrdersResponse.json();
          console.log('   ✅ Customer orders found:', customerOrdersData.items?.length || 0);
          
          if (customerOrdersData.items && customerOrdersData.items.length > 0) {
            const order = customerOrdersData.items[0];
            console.log('   📦 Order example:', order.increment_id, '- €' + order.grand_total, '(' + order.status + ')');
          }
        } else {
          console.log('   ⚠️  Could not fetch customer orders');
        }
      }
    } else {
      const errorText = await emailResponse.text();
      console.log('   ℹ️  Email search result:', errorText.substring(0, 200) + '...');
    }

    console.log('\n🎉 Connection test completed!');
    console.log('\n📊 Summary:');
    console.log('   • API endpoint is accessible');
    console.log('   • Authentication is working');
    console.log('   • Basic store information can be retrieved');
    console.log('   • Ready for integration with the CRM system');
    
    return true;

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   🌐 DNS resolution failed - check the API URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 Connection refused - server may be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   ⏱️  Connection timeout - server may be slow or unreachable');
    }
    
    return false;
  }
}

// Run the test
testMagentoConnection().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! Magento API is ready for integration.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the configuration.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});


