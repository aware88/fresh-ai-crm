#!/usr/bin/env node

/**
 * Discover Magento API Endpoints
 * 
 * This script tries to discover the correct API endpoints for the Magento installation
 */

const fetch = require('node-fetch');

// Magento credentials
const MAGENTO_CONFIG = {
  baseUrl: 'https://withcar.si',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

async function discoverMagentoEndpoints() {
  console.log('🔍 Discovering Magento API Endpoints...');
  console.log('🌐 Base URL:', MAGENTO_CONFIG.baseUrl);

  // Test different possible API endpoint patterns
  const tokenEndpoints = [
    // Standard Magento REST API
    '/rest/V1/integration/admin/token',
    '/rest/default/V1/integration/admin/token',
    '/rest/all/V1/integration/admin/token',
    
    // With index.php
    '/index.php/rest/V1/integration/admin/token',
    '/index.php/rest/default/V1/integration/admin/token',
    
    // Custom admin paths
    '/urednik/rest/V1/integration/admin/token',
    '/admin/rest/V1/integration/admin/token',
    
    // API directory
    '/api/rest/V1/integration/admin/token',
    '/api/V1/integration/admin/token',
    
    // Different versions
    '/rest/V2/integration/admin/token',
    '/rest/v1/integration/admin/token',
    
    // Custom paths
    '/magento/rest/V1/integration/admin/token',
    '/shop/rest/V1/integration/admin/token'
  ];

  let workingEndpoint = null;

  for (const endpoint of tokenEndpoints) {
    try {
      console.log(`\n🧪 Testing: ${endpoint}`);
      const url = `${MAGENTO_CONFIG.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: MAGENTO_CONFIG.apiUser,
          password: MAGENTO_CONFIG.apiSecret
        }),
        timeout: 10000
      });

      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const token = await response.text();
        console.log('   ✅ SUCCESS! Token endpoint found');
        console.log('   🔑 Token received:', token.substring(0, 20) + '...');
        workingEndpoint = endpoint;
        
        // Test the token with a simple API call
        await testTokenWithEndpoint(token.replace(/"/g, ''), endpoint);
        break;
      } else if (response.status === 401) {
        console.log('   🔐 Endpoint exists but authentication failed');
        
        // Try with API key as password
        const response2 = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username: MAGENTO_CONFIG.apiUser,
            password: MAGENTO_CONFIG.apiKey
          }),
          timeout: 10000
        });

        if (response2.status === 200) {
          const token = await response2.text();
          console.log('   ✅ SUCCESS with API Key as password!');
          console.log('   🔑 Token received:', token.substring(0, 20) + '...');
          workingEndpoint = endpoint;
          
          await testTokenWithEndpoint(token.replace(/"/g, ''), endpoint);
          break;
        }
      } else if (response.status !== 404) {
        const responseText = await response.text();
        if (!responseText.includes('<html>')) {
          console.log('   📄 Response:', responseText.substring(0, 100) + '...');
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  if (!workingEndpoint) {
    console.log('\n❌ No working token endpoint found');
    
    // Try to find API documentation or hints
    console.log('\n🔍 Looking for API documentation...');
    await searchForApiDocumentation();
    
    // Try direct API calls with different auth methods
    console.log('\n🔍 Trying direct API calls with different auth methods...');
    await tryDirectApiCalls();
  }

  return workingEndpoint;
}

async function testTokenWithEndpoint(token, tokenEndpoint) {
  console.log('\n🧪 Testing token with API calls...');
  
  // Derive the base API path from the token endpoint
  const basePath = tokenEndpoint.replace('/integration/admin/token', '');
  
  const testEndpoints = [
    `${basePath}/store/storeConfigs`,
    `${basePath}/customers/search?searchCriteria[pageSize]=1`,
    `${basePath}/orders?searchCriteria[pageSize]=1`
  ];

  for (const endpoint of testEndpoints) {
    try {
      console.log(`   🔍 Testing: ${endpoint}`);
      
      const response = await fetch(`${MAGENTO_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: ${endpoint}`);
        
        if (Array.isArray(data)) {
          console.log(`   📊 Results: ${data.length} items`);
        } else if (data.items) {
          console.log(`   📊 Results: ${data.items.length} items (total: ${data.total_count || 'unknown'})`);
        }
      } else {
        const errorText = await response.text();
        if (!errorText.includes('<html>')) {
          console.log(`   📄 Error: ${errorText.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function searchForApiDocumentation() {
  const docPaths = [
    '/api',
    '/api/doc',
    '/api/docs',
    '/rest',
    '/rest/docs',
    '/swagger',
    '/api-docs',
    '/magento/api',
    '/dev/api',
    '/developer'
  ];

  for (const path of docPaths) {
    try {
      const response = await fetch(`${MAGENTO_CONFIG.baseUrl}${path}`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        console.log(`   ✅ Found: ${path} (${response.status})`);
        const content = await response.text();
        
        // Look for API-related keywords
        if (content.includes('rest') || content.includes('api') || content.includes('token')) {
          console.log(`   📄 Contains API references`);
        }
      }
    } catch (error) {
      // Ignore errors for doc search
    }
  }
}

async function tryDirectApiCalls() {
  const authMethods = [
    {
      name: 'Basic Auth (User:Secret)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${MAGENTO_CONFIG.apiUser}:${MAGENTO_CONFIG.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Basic Auth (User:Key)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${MAGENTO_CONFIG.apiUser}:${MAGENTO_CONFIG.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'API Key Header',
      headers: {
        'X-API-KEY': MAGENTO_CONFIG.apiKey,
        'X-API-SECRET': MAGENTO_CONFIG.apiSecret,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Custom Headers',
      headers: {
        'X-Magento-API-Key': MAGENTO_CONFIG.apiKey,
        'X-Magento-User': MAGENTO_CONFIG.apiUser,
        'Content-Type': 'application/json'
      }
    }
  ];

  const endpoints = [
    '/rest/V1/store/storeConfigs',
    '/api/rest/store/storeConfigs',
    '/rest/V1/customers/search?searchCriteria[pageSize]=1'
  ];

  for (const authMethod of authMethods) {
    console.log(`\n   🔐 Trying: ${authMethod.name}`);
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${MAGENTO_CONFIG.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: authMethod.headers,
          timeout: 8000
        });

        if (response.ok) {
          console.log(`   ✅ SUCCESS: ${authMethod.name} with ${endpoint}`);
          const data = await response.json();
          console.log(`   📊 Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
          return true;
        } else if (response.status !== 404) {
          console.log(`   📊 ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        // Continue trying
      }
    }
  }

  return false;
}

// Run the discovery
discoverMagentoEndpoints().then(endpoint => {
  if (endpoint) {
    console.log('\n🎉 Working API endpoint discovered!');
    console.log(`📍 Token endpoint: ${endpoint}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Update the API client to use this endpoint');
    console.log('   2. Test the full integration');
    process.exit(0);
  } else {
    console.log('\n❌ No working API endpoint found.');
    console.log('\n💡 Possible issues:');
    console.log('   1. REST API is not enabled in Magento');
    console.log('   2. Custom API implementation');
    console.log('   3. Different authentication method required');
    console.log('   4. API is behind authentication/firewall');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Discovery failed:', error);
  process.exit(1);
});

