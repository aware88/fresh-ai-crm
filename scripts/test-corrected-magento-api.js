#!/usr/bin/env node

/**
 * Test script for corrected Magento API configuration
 * Based on IT team feedback: https://www.withcar.si/api/rest/products with token auth
 */

const fetch = require('node-fetch');

const config = {
  apiUrl: 'https://www.withcar.si/api/rest',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

async function getAdminToken() {
  console.log('🔑 Getting admin token...');
  
  const tokenUrl = `${config.apiUrl}/V1/integration/admin/token`;
  
  const tokenPayload = {
    username: config.apiUser,
    password: config.apiSecret
  };

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tokenPayload)
    });

    console.log(`Token request status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    const token = responseText.replace(/"/g, ''); // Remove quotes if present
    
    console.log('✅ Token acquired successfully');
    console.log(`Token length: ${token.length} characters`);
    
    return token;
  } catch (error) {
    console.error('❌ Token acquisition failed:', error.message);
    throw error;
  }
}

async function testProductsEndpoint(token) {
  console.log('\n📦 Testing products endpoint...');
  
  const productsUrl = `${config.apiUrl}/V1/products?searchCriteria[pageSize]=5`;
  
  try {
    const response = await fetch(productsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Products request status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Products request failed: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`Response content-type: ${contentType}`);
    
    const responseText = await response.text();
    
    if (contentType && contentType.includes('application/json')) {
      const data = JSON.parse(responseText);
      console.log('✅ Products endpoint working!');
      console.log(`Found ${data.items ? data.items.length : 0} products`);
      console.log(`Total count: ${data.total_count || 'unknown'}`);
      
      if (data.items && data.items.length > 0) {
        console.log('\nFirst product sample:');
        const firstProduct = data.items[0];
        console.log(`- ID: ${firstProduct.id}`);
        console.log(`- SKU: ${firstProduct.sku}`);
        console.log(`- Name: ${firstProduct.name}`);
        console.log(`- Status: ${firstProduct.status}`);
      }
      
      return true;
    } else {
      console.log('⚠️  Response is not JSON:', responseText.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error('❌ Products endpoint failed:', error.message);
    return false;
  }
}

async function testCustomersEndpoint(token) {
  console.log('\n👥 Testing customers endpoint...');
  
  const customersUrl = `${config.apiUrl}/V1/customers/search?searchCriteria[pageSize]=3`;
  
  try {
    const response = await fetch(customersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Customers request status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Customers request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Customers endpoint working!');
    console.log(`Found ${data.items ? data.items.length : 0} customers`);
    console.log(`Total count: ${data.total_count || 'unknown'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Customers endpoint failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Corrected Magento API Configuration');
  console.log('='.repeat(50));
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`User: ${config.apiUser}`);
  console.log('='.repeat(50));

  try {
    // Step 1: Get admin token
    const token = await getAdminToken();
    
    // Step 2: Test products endpoint (as mentioned by IT team)
    const productsWorking = await testProductsEndpoint(token);
    
    // Step 3: Test customers endpoint
    const customersWorking = await testCustomersEndpoint(token);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Token authentication: SUCCESS`);
    console.log(`${productsWorking ? '✅' : '❌'} Products endpoint: ${productsWorking ? 'SUCCESS' : 'FAILED'}`);
    console.log(`${customersWorking ? '✅' : '❌'} Customers endpoint: ${customersWorking ? 'SUCCESS' : 'FAILED'}`);
    
    if (productsWorking && customersWorking) {
      console.log('\n🎉 All tests passed! Magento API is working correctly.');
      console.log('The integration should now work with real data.');
    } else {
      console.log('\n⚠️  Some endpoints failed, but token auth is working.');
      console.log('Check endpoint URLs or permissions.');
    }
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.log('\n🔧 Please check:');
    console.log('1. API URL is correct');
    console.log('2. Username and password are correct');
    console.log('3. API user has proper permissions');
    console.log('4. Magento REST API is enabled');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
