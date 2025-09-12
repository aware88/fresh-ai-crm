#!/usr/bin/env node

/**
 * Final test for Magento token authentication
 * Testing with correct base URL structure
 */

const fetch = require('node-fetch');

const config = {
  baseUrl: 'https://www.withcar.si',
  apiUser: 'tim',
  apiKey: '0de047e9c988989bd00f49745f92748b',
  apiSecret: 'd832e7eaefd0ce796171a38199295b0b'
};

async function testTokenEndpoint(tokenUrl, credentials) {
  console.log(`\n🔑 Testing token endpoint: ${tokenUrl}`);
  
  const tokenPayload = {
    username: credentials.username,
    password: credentials.password
  };
  
  console.log(`Payload: ${JSON.stringify(tokenPayload, null, 2)}`);
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(tokenPayload),
      timeout: 15000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Token acquired successfully!');
      const token = responseText.replace(/"/g, '');
      console.log(`Token: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
      return token;
    } else {
      console.log('❌ Token request failed:');
      console.log(responseText);
      return null;
    }
  } catch (error) {
    console.log('❌ Request error:', error.message);
    return null;
  }
}

async function testWithToken(token) {
  console.log('\n📦 Testing products endpoint with token...');
  
  const productsUrl = 'https://www.withcar.si/api/rest/products';
  
  try {
    const response = await fetch(productsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Products endpoint works with token!');
      
      try {
        const data = JSON.parse(responseText);
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} products`);
        } else if (data.items) {
          console.log(`Found ${data.items.length} products (total: ${data.total_count})`);
        } else {
          console.log('Response structure:', Object.keys(data));
        }
        return true;
      } catch (parseError) {
        console.log('Response is not JSON:', responseText.substring(0, 200));
        return false;
      }
    } else {
      console.log('❌ Products request failed:');
      console.log(responseText);
      return false;
    }
  } catch (error) {
    console.log('❌ Request error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Final Magento Token Authentication Test');
  console.log('='.repeat(50));
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`User: ${config.apiUser}`);
  console.log('='.repeat(50));

  // Test various token endpoint patterns
  const tokenEndpoints = [
    `${config.baseUrl}/rest/V1/integration/admin/token`,
    `${config.baseUrl}/api/rest/V1/integration/admin/token`,
    `${config.baseUrl}/rest/all/V1/integration/admin/token`,
    `${config.baseUrl}/index.php/rest/V1/integration/admin/token`,
    `${config.baseUrl}/index.php/api/rest/V1/integration/admin/token`
  ];
  
  // Test with both secret and key as password
  const credentialSets = [
    { username: config.apiUser, password: config.apiSecret, name: 'secret' },
    { username: config.apiUser, password: config.apiKey, name: 'key' }
  ];
  
  let workingToken = null;
  
  for (const credentials of credentialSets) {
    console.log(`\n🔐 Testing with ${credentials.name} as password`);
    console.log('-'.repeat(30));
    
    for (const tokenUrl of tokenEndpoints) {
      const token = await testTokenEndpoint(tokenUrl, credentials);
      if (token) {
        workingToken = token;
        console.log(`✅ Working token endpoint found: ${tokenUrl}`);
        console.log(`✅ Working credentials: ${credentials.name}`);
        break;
      }
    }
    
    if (workingToken) break;
  }
  
  if (workingToken) {
    // Test the products endpoint
    const productsWorking = await testWithToken(workingToken);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Token authentication: WORKING');
    console.log(`✅ Products endpoint: ${productsWorking ? 'WORKING' : 'NEEDS INVESTIGATION'}`);
    console.log('\n📋 Integration Configuration:');
    console.log(`- Base URL: ${config.baseUrl}`);
    console.log(`- Products endpoint: ${config.baseUrl}/api/rest/products`);
    console.log('- Authentication: Bearer token');
    console.log('- Token endpoint: [found working endpoint above]');
    
  } else {
    console.log('\n' + '='.repeat(50));
    console.log('❌ NO WORKING TOKEN ENDPOINT FOUND');
    console.log('='.repeat(50));
    console.log('\n📝 Message for IT team in Slovenian:');
    console.log('-'.repeat(30));
    console.log('Spoštovana IT ekipa,');
    console.log('');
    console.log('Testirali smo različne možnosti za pridobitev avtentikacijskega žetona');
    console.log('za Magento REST API, vendar nobena ni delovala. Prosimo vas za:');
    console.log('');
    console.log('1. Točen URL za pridobitev admin tokena');
    console.log('2. Primer delujoče curl komande za pridobitev tokena');
    console.log('3. Potrditev, da so naša poverilnica pravilna:');
    console.log(`   - Uporabnik: ${config.apiUser}`);
    console.log(`   - API ključ: ${config.apiKey}`);
    console.log(`   - API skrivnost: ${config.apiSecret}`);
    console.log('');
    console.log('Endpoint https://www.withcar.si/api/rest/products obstaja in vrača');
    console.log('napako 403, kar pomeni da potrebujemo veljaven token.');
    console.log('');
    console.log('Hvala za pomoč!');
  }
}

if (require.main === module) {
  main();
}
