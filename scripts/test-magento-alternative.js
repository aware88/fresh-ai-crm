#!/usr/bin/env node

/**
 * Test Magento Connection - Alternative Methods
 * 
 * This script tries different authentication methods and endpoints for Magento
 */

const fetch = require('node-fetch');

// Magento API credentials from user
const MAGENTO_CONFIG = {
  baseUrl: 'https://withcar.si',
  adminPath: '/urednik',
  apiKey: '4M40bZ&88w^1',
  apiUser: 'tim'
};

async function testMagentoAlternatives() {
  console.log('🧪 Testing Magento API - Alternative Methods...');
  console.log('🌐 Base URL:', MAGENTO_CONFIG.baseUrl);
  console.log('⚙️  Admin Path:', MAGENTO_CONFIG.adminPath);
  console.log('👤 API User:', MAGENTO_CONFIG.apiUser);
  console.log('🔑 API Key:', MAGENTO_CONFIG.apiKey.substring(0, 8) + '...');

  const testEndpoints = [
    // Standard Magento REST API endpoints
    `${MAGENTO_CONFIG.baseUrl}/rest/V1/store/storeConfigs`,
    `${MAGENTO_CONFIG.baseUrl}/rest/default/V1/store/storeConfigs`,
    `${MAGENTO_CONFIG.baseUrl}/rest/all/V1/store/storeConfigs`,
    
    // Admin-specific endpoints
    `${MAGENTO_CONFIG.baseUrl}${MAGENTO_CONFIG.adminPath}/rest/V1/store/storeConfigs`,
    `${MAGENTO_CONFIG.baseUrl}${MAGENTO_CONFIG.adminPath}/rest/default/V1/store/storeConfigs`,
    
    // Alternative paths
    `${MAGENTO_CONFIG.baseUrl}/index.php/rest/V1/store/storeConfigs`,
    `${MAGENTO_CONFIG.baseUrl}/api/rest/V1/store/storeConfigs`,
    
    // Check if it's a custom API path
    `${MAGENTO_CONFIG.baseUrl}${MAGENTO_CONFIG.adminPath}/api/rest/V1/store/storeConfigs`,
    
    // Try without specific endpoint first
    `${MAGENTO_CONFIG.baseUrl}/rest/V1/`,
    `${MAGENTO_CONFIG.baseUrl}${MAGENTO_CONFIG.adminPath}/rest/V1/`
  ];

  const authMethods = [
    {
      name: 'Bearer Token',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Basic Auth (User:Key)',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${MAGENTO_CONFIG.apiUser}:${MAGENTO_CONFIG.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'API Key Header',
      headers: {
        'X-API-KEY': MAGENTO_CONFIG.apiKey,
        'X-API-USER': MAGENTO_CONFIG.apiUser,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    {
      name: 'Custom Headers',
      headers: {
        'X-Magento-API-Key': MAGENTO_CONFIG.apiKey,
        'X-Magento-User': MAGENTO_CONFIG.apiUser,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  ];

  let foundWorkingEndpoint = false;

  for (const endpoint of testEndpoints) {
    console.log(`\n🔍 Testing endpoint: ${endpoint}`);
    
    for (const authMethod of authMethods) {
      try {
        console.log(`   🔐 Auth method: ${authMethod.name}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: authMethod.headers,
          timeout: 10000
        });

        console.log(`   📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log('   ✅ SUCCESS! Working endpoint found');
          const data = await response.json();
          console.log('   📄 Response type:', Array.isArray(data) ? 'Array' : typeof data);
          
          if (Array.isArray(data)) {
            console.log('   📊 Items count:', data.length);
          } else if (data && typeof data === 'object') {
            console.log('   🔑 Response keys:', Object.keys(data).slice(0, 5).join(', '));
          }
          
          foundWorkingEndpoint = true;
          
          console.log('\n🎉 WORKING CONFIGURATION FOUND:');
          console.log('   🌐 Endpoint:', endpoint);
          console.log('   🔐 Auth:', authMethod.name);
          console.log('   📋 Headers:', JSON.stringify(authMethod.headers, null, 2));
          
          return { endpoint, authMethod, data };
        } else {
          const errorText = await response.text();
          const preview = errorText.length > 100 ? errorText.substring(0, 100) + '...' : errorText;
          console.log(`   ❌ Error: ${preview}`);
        }
      } catch (error) {
        console.log(`   💥 Exception: ${error.message}`);
      }
    }
  }

  if (!foundWorkingEndpoint) {
    console.log('\n❌ No working endpoint found with any authentication method');
    
    // Try to access the base URL to see if the site is accessible
    console.log('\n🔍 Testing base site accessibility...');
    try {
      const baseResponse = await fetch(MAGENTO_CONFIG.baseUrl, {
        method: 'GET',
        timeout: 10000
      });
      
      console.log(`📊 Base site status: ${baseResponse.status} ${baseResponse.statusText}`);
      
      if (baseResponse.ok) {
        const html = await baseResponse.text();
        console.log('✅ Base site is accessible');
        
        // Look for Magento indicators in the HTML
        if (html.includes('Magento')) {
          console.log('🔍 Found Magento indicators in the HTML');
        }
        
        // Look for API documentation links
        if (html.includes('/rest/') || html.includes('/api/')) {
          console.log('🔍 Found API-related paths in the HTML');
        }
      }
    } catch (error) {
      console.log(`❌ Base site not accessible: ${error.message}`);
    }

    // Try the admin panel
    console.log('\n🔍 Testing admin panel accessibility...');
    try {
      const adminResponse = await fetch(`${MAGENTO_CONFIG.baseUrl}${MAGENTO_CONFIG.adminPath}`, {
        method: 'GET',
        timeout: 10000
      });
      
      console.log(`📊 Admin panel status: ${adminResponse.status} ${adminResponse.statusText}`);
      
      if (adminResponse.ok) {
        console.log('✅ Admin panel is accessible');
      }
    } catch (error) {
      console.log(`❌ Admin panel not accessible: ${error.message}`);
    }
  }

  return null;
}

// Run the test
testMagentoAlternatives().then(result => {
  if (result) {
    console.log('\n✅ Magento API connection successful!');
    console.log('📋 Use this configuration in your application.');
    process.exit(0);
  } else {
    console.log('\n❌ Could not establish connection to Magento API.');
    console.log('💡 Suggestions:');
    console.log('   1. Verify the API credentials are correct');
    console.log('   2. Check if the API is enabled in Magento admin');
    console.log('   3. Ensure the user has proper API permissions');
    console.log('   4. Contact the site administrator for the correct API endpoint');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});


