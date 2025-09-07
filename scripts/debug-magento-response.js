#!/usr/bin/env node

/**
 * Debug Magento API Response
 * 
 * This script analyzes the actual response from Magento API calls
 */

const fetch = require('node-fetch');

// Magento API credentials from user
const MAGENTO_CONFIG = {
  baseUrl: 'https://withcar.si',
  apiKey: '4M40bZ&88w^1',
  apiUser: 'tim'
};

async function debugMagentoResponse() {
  console.log('🔍 Debugging Magento API Response...');
  console.log('🌐 Base URL:', MAGENTO_CONFIG.baseUrl);
  console.log('👤 API User:', MAGENTO_CONFIG.apiUser);

  const endpoint = `${MAGENTO_CONFIG.baseUrl}/rest/V1/store/storeConfigs`;
  
  try {
    console.log(`\n📡 Making request to: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Withcar-CRM/1.0'
      },
      redirect: 'manual', // Don't follow redirects automatically
      timeout: 15000
    });

    console.log('\n📊 Response Analysis:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Headers:');
    
    for (const [key, value] of response.headers.entries()) {
      console.log(`     ${key}: ${value}`);
    }

    // Check if it's a redirect
    if (response.status >= 300 && response.status < 400) {
      console.log('\n🔄 This is a redirect response');
      const location = response.headers.get('location');
      if (location) {
        console.log('   Redirect to:', location);
      }
    }

    // Get the response body
    const responseText = await response.text();
    console.log('\n📄 Response Body (first 500 chars):');
    console.log(responseText.substring(0, 500));
    
    if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
      console.log('\n⚠️  Response is HTML (not JSON API response)');
      
      // Look for Magento-specific patterns
      if (responseText.includes('Magento')) {
        console.log('✅ Contains Magento references');
      }
      
      if (responseText.includes('rest/V1')) {
        console.log('✅ Contains REST API references');
      }
      
      if (responseText.includes('admin') || responseText.includes('login')) {
        console.log('⚠️  Might be redirecting to admin login');
      }
    } else {
      console.log('\n✅ Response appears to be non-HTML (possibly JSON)');
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✅ Valid JSON response');
        console.log('📊 JSON keys:', Object.keys(jsonData));
      } catch (e) {
        console.log('❌ Not valid JSON');
      }
    }

    // Test a simpler endpoint
    console.log('\n🔍 Testing simpler endpoint...');
    const simpleEndpoint = `${MAGENTO_CONFIG.baseUrl}/rest/V1/`;
    
    const simpleResponse = await fetch(simpleEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      redirect: 'manual',
      timeout: 10000
    });

    console.log('📊 Simple endpoint status:', simpleResponse.status, simpleResponse.statusText);
    
    const simpleText = await simpleResponse.text();
    console.log('📄 Simple response (first 200 chars):');
    console.log(simpleText.substring(0, 200));

    // Try to access the actual Magento admin API
    console.log('\n🔍 Testing integration token authentication...');
    
    // This is the proper way to authenticate with Magento using integration tokens
    const tokenEndpoint = `${MAGENTO_CONFIG.baseUrl}/rest/V1/integration/admin/token`;
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: MAGENTO_CONFIG.apiUser,
        password: MAGENTO_CONFIG.apiKey
      }),
      redirect: 'manual',
      timeout: 10000
    });

    console.log('📊 Token endpoint status:', tokenResponse.status, tokenResponse.statusText);
    
    if (tokenResponse.ok) {
      const token = await tokenResponse.text();
      console.log('✅ Token received:', token.substring(0, 20) + '...');
      
      // Now try using the token
      console.log('\n🔍 Testing with received token...');
      const authenticatedResponse = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.replace(/"/g, '')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('📊 Authenticated request status:', authenticatedResponse.status, authenticatedResponse.statusText);
      
      if (authenticatedResponse.ok) {
        const authData = await authenticatedResponse.json();
        console.log('✅ SUCCESS! API is working with proper authentication');
        console.log('📊 Store configs found:', Array.isArray(authData) ? authData.length : 1);
        return true;
      }
    } else {
      const tokenError = await tokenResponse.text();
      console.log('❌ Token request failed:', tokenError.substring(0, 200));
    }

  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }

  return false;
}

// Run the debug
debugMagentoResponse().then(success => {
  if (success) {
    console.log('\n✅ Magento API is accessible with proper authentication!');
  } else {
    console.log('\n❌ Could not establish working API connection.');
    console.log('\n💡 Possible issues:');
    console.log('   1. The API key might be a password, not a token');
    console.log('   2. Integration tokens need to be generated in Magento admin');
    console.log('   3. The API might be disabled or restricted');
    console.log('   4. Different authentication method is required');
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
});


