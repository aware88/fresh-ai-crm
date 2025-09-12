#!/usr/bin/env node

/**
 * Test the exact endpoint mentioned by IT team
 * URL: https://www.withcar.si/api/rest/products
 */

const fetch = require('node-fetch');

const config = {
  baseUrl: 'https://www.withcar.si/api/rest',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

// Test Basic Auth
function getBasicAuthHeader() {
  const credentials = `${config.apiUser}:${config.apiSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function testExactEndpoint() {
  console.log('🎯 Testing EXACT endpoint mentioned by IT team');
  console.log('='.repeat(50));
  
  const exactUrl = 'https://www.withcar.si/api/rest/products';
  console.log(`URL: ${exactUrl}`);
  
  // Test with different auth methods
  const authMethods = [
    {
      name: 'Basic Auth (user:secret)',
      headers: {
        'Authorization': getBasicAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Basic Auth (user:key)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.apiUser}:${config.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'No Auth',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  ];
  
  for (const authMethod of authMethods) {
    console.log(`\n🔐 Testing with: ${authMethod.name}`);
    
    try {
      const response = await fetch(exactUrl, {
        method: 'GET',
        headers: authMethod.headers,
        timeout: 15000
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get('content-type') || 'unknown';
      console.log(`Content-Type: ${contentType}`);
      
      // Log response headers for debugging
      console.log('Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const responseText = await response.text();
      
      if (response.ok) {
        if (contentType.includes('application/json')) {
          try {
            const data = JSON.parse(responseText);
            console.log('✅ SUCCESS - Valid JSON response');
            
            if (Array.isArray(data)) {
              console.log(`Found ${data.length} products`);
              if (data.length > 0) {
                console.log('First product:', JSON.stringify(data[0], null, 2).substring(0, 200));
              }
            } else if (data.items) {
              console.log(`Found ${data.items.length} products`);
              console.log(`Total count: ${data.total_count || 'unknown'}`);
            } else {
              console.log('Response structure:', Object.keys(data));
            }
            
            return { success: true, method: authMethod.name, data };
          } catch (parseError) {
            console.log('❌ Invalid JSON:', responseText.substring(0, 200));
          }
        } else {
          console.log('⚠️  Non-JSON response:', responseText.substring(0, 200));
          
          // Check if it's HTML (redirect)
          if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
            console.log('🔄 Response appears to be HTML redirect');
          }
        }
      } else {
        console.log('❌ HTTP Error Response:');
        console.log(responseText.substring(0, 500));
        
        if (response.status === 401) {
          console.log('🔑 Authentication required');
        } else if (response.status === 403) {
          console.log('🚫 Access forbidden - check permissions');
        } else if (response.status === 404) {
          console.log('❓ Endpoint not found');
        }
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
  }
  
  return null;
}

async function testAlternativeEndpoints() {
  console.log('\n🔍 Testing alternative product endpoints');
  console.log('='.repeat(40));
  
  const endpoints = [
    'https://www.withcar.si/api/rest/products',
    'https://www.withcar.si/rest/V1/products',
    'https://www.withcar.si/rest/products',
    'https://www.withcar.si/api/products',
    'https://www.withcar.si/products',
    'https://www.withcar.si/api/rest/V1/products'
  ];
  
  const authHeaders = {
    'Authorization': getBasicAuthHeader(),
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: authHeaders,
        timeout: 10000
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          console.log('✅ JSON response received');
          const text = await response.text();
          console.log(`Response length: ${text.length} chars`);
        } else {
          console.log('⚠️  Non-JSON response');
        }
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Testing IT Team\'s Exact Magento Endpoint');
  console.log('IT team said: "Pravi je: https://www.withcar.si/api/rest/products"');
  console.log('IT team said: "Moraš pa met token, drugače ti javi 403."');
  console.log('='.repeat(60));

  // Test the exact endpoint
  const result = await testExactEndpoint();
  
  // Test alternative endpoints
  await testAlternativeEndpoints();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 CONCLUSION');
  console.log('='.repeat(50));
  
  if (result) {
    console.log(`✅ SUCCESS with ${result.method}`);
    console.log('The endpoint works! Update your integration to use this method.');
  } else {
    console.log('❌ No working configuration found');
    console.log('\n💡 Possible issues:');
    console.log('1. Token authentication might be required (not Basic Auth)');
    console.log('2. Different endpoint structure than expected');
    console.log('3. API might require specific headers or parameters');
    console.log('4. Server configuration issue (redirects, etc.)');
    console.log('\n📝 Recommendation for IT team:');
    console.log('Please provide:');
    console.log('- Exact working curl command example');
    console.log('- Token generation method if required');
    console.log('- Complete API documentation or endpoint list');
  }
}

if (require.main === module) {
  main();
}
