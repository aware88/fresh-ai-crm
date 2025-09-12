#!/usr/bin/env node

/**
 * Discover working authentication methods for Magento API
 * Test various endpoints and auth methods
 */

const fetch = require('node-fetch');

const config = {
  apiUrl: 'https://www.withcar.si/api/rest',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

// Test Basic Auth
function getBasicAuthHeader() {
  const credentials = `${config.apiUser}:${config.apiSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function testEndpoint(url, headers, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      timeout: 10000
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type') || 'unknown';
    console.log(`Content-Type: ${contentType}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      if (contentType.includes('application/json')) {
        try {
          const data = JSON.parse(responseText);
          console.log('✅ SUCCESS - Valid JSON response');
          
          if (data.items) {
            console.log(`Found ${data.items.length} items`);
          } else if (Array.isArray(data)) {
            console.log(`Found ${data.length} items in array`);
          } else {
            console.log('Response structure:', Object.keys(data).slice(0, 5));
          }
          
          return { success: true, data };
        } catch (parseError) {
          console.log('❌ Invalid JSON:', responseText.substring(0, 100));
          return { success: false, error: 'Invalid JSON' };
        }
      } else {
        console.log('⚠️  Non-JSON response:', responseText.substring(0, 100));
        return { success: false, error: 'Non-JSON response' };
      }
    } else {
      console.log('❌ HTTP Error:', responseText.substring(0, 200));
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testTokenEndpoints() {
  console.log('🔑 Testing Token Endpoints');
  console.log('='.repeat(40));
  
  const tokenEndpoints = [
    '/V1/integration/admin/token',
    '/V1/integration/customer/token',
    '/rest/V1/integration/admin/token',
    '/rest/V1/integration/customer/token',
    '/admin/integration/admin/token',
    '/api/rest/V1/integration/admin/token'
  ];
  
  const tokenPayload = {
    username: config.apiUser,
    password: config.apiSecret
  };
  
  for (const endpoint of tokenEndpoints) {
    const url = `${config.apiUrl}${endpoint}`;
    console.log(`\n🔍 Testing token endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(tokenPayload),
        timeout: 10000
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ Token endpoint found!');
        console.log(`Token response: ${responseText.substring(0, 50)}...`);
        return responseText.replace(/"/g, '');
      } else {
        const errorText = await response.text();
        console.log(`❌ ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  return null;
}

async function testBasicAuthEndpoints() {
  console.log('\n🔐 Testing Basic Auth Endpoints');
  console.log('='.repeat(40));
  
  const basicAuthHeader = getBasicAuthHeader();
  const headers = {
    'Authorization': basicAuthHeader,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const endpoints = [
    { path: '/V1/products', desc: 'Products endpoint' },
    { path: '/V1/customers/search', desc: 'Customers search' },
    { path: '/V1/orders', desc: 'Orders endpoint' },
    { path: '/V1/store/storeConfigs', desc: 'Store configs' },
    { path: '/V1/store/websites', desc: 'Store websites' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const url = `${config.apiUrl}${endpoint.path}?searchCriteria[pageSize]=1`;
    const result = await testEndpoint(url, headers, endpoint.desc);
    results.push({ endpoint: endpoint.path, ...result });
  }
  
  return results;
}

async function main() {
  console.log('🚀 Discovering Magento Authentication Methods');
  console.log('='.repeat(50));
  console.log(`Base URL: ${config.apiUrl}`);
  console.log(`User: ${config.apiUser}`);
  console.log('='.repeat(50));

  // Test 1: Try to find working token endpoints
  const token = await testTokenEndpoints();
  
  // Test 2: Test Basic Auth with various endpoints
  const basicAuthResults = await testBasicAuthEndpoints();
  
  // Test 3: If token was found, test with Bearer auth
  if (token) {
    console.log('\n🎟️  Testing Bearer Token Auth');
    console.log('='.repeat(40));
    
    const bearerHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const url = `${config.apiUrl}/V1/products?searchCriteria[pageSize]=1`;
    await testEndpoint(url, bearerHeaders, 'Products with Bearer token');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  
  const workingEndpoints = basicAuthResults.filter(r => r.success);
  
  console.log(`Token endpoint found: ${token ? '✅ YES' : '❌ NO'}`);
  console.log(`Basic Auth working endpoints: ${workingEndpoints.length}/${basicAuthResults.length}`);
  
  if (workingEndpoints.length > 0) {
    console.log('\n✅ Working endpoints with Basic Auth:');
    workingEndpoints.forEach(r => {
      console.log(`  - ${r.endpoint}`);
    });
    
    console.log('\n🎉 RECOMMENDATION: Use Basic Authentication');
    console.log('The Magento API supports Basic Auth but may not have token endpoints enabled.');
    
  } else {
    console.log('\n❌ No working endpoints found');
    console.log('Check API configuration, permissions, or URL.');
  }
}

if (require.main === module) {
  main();
}
