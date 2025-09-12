#!/usr/bin/env node

/**
 * Test Magento OAuth 1.0 authentication
 * Based on the eGlobe IT Solutions article
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

const config = {
  baseUrl: 'https://www.withcar.si',
  apiUrl: 'https://www.withcar.si/api/rest',
  consumerKey: 'tim', // Our API user
  consumerSecret: 'd832e7eaefd0ce796171a38199295b0b' // Our API secret
};

/**
 * Create OAuth 1.0 signature and headers
 */
function createOAuth1Headers(method, url, params = {}, token = '', tokenSecret = '') {
  const oauth = {
    oauth_consumer_key: config.consumerKey,
    oauth_nonce: Math.random().toString(36).substring(2, 15),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0'
  };

  if (token) {
    oauth.oauth_token = token;
  }

  // Combine OAuth params with request params
  const allParams = { ...oauth, ...params };
  
  // Create signature base string
  const paramString = Object.keys(allParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');
  
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  
  // Create signing key
  const signingKey = `${encodeURIComponent(config.consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  // Create signature
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  
  oauth.oauth_signature = signature;

  // Create Authorization header
  const authHeader = 'OAuth ' + Object.keys(oauth)
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauth[key])}"`)
    .join(', ');

  return {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Step 1: OAuth initiate
 */
async function testOAuthInitiate() {
  console.log('\n🔑 Step 1: Testing OAuth initiate...');
  
  const initiateUrl = `${config.baseUrl}/oauth/initiate?oauth_callback=http://example.com`;
  const headers = createOAuth1Headers('POST', initiateUrl);
  
  console.log(`URL: ${initiateUrl}`);
  console.log(`Authorization: ${headers.Authorization.substring(0, 100)}...`);
  
  try {
    const response = await fetch(initiateUrl, {
      method: 'POST',
      headers: headers,
      timeout: 15000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Response: ${responseText}`);
    
    if (response.ok) {
      // Parse response: oauth_token=xxx&oauth_token_secret=yyy&oauth_callback_confirmed=true
      const params = new URLSearchParams(responseText);
      const token = params.get('oauth_token');
      const tokenSecret = params.get('oauth_token_secret');
      
      if (token && tokenSecret) {
        console.log('✅ OAuth initiate successful!');
        console.log(`Token: ${token.substring(0, 10)}...`);
        console.log(`Token Secret: ${tokenSecret.substring(0, 10)}...`);
        return { token, tokenSecret };
      } else {
        console.log('❌ Invalid response format');
        return null;
      }
    } else {
      console.log('❌ OAuth initiate failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test direct product access with OAuth 1.0
 */
async function testDirectProductAccess(token = '', tokenSecret = '') {
  console.log('\n📦 Testing direct product access with OAuth 1.0...');
  
  const productUrl = `${config.apiUrl}/products`;
  const headers = createOAuth1Headers('GET', productUrl, {}, token, tokenSecret);
  
  console.log(`URL: ${productUrl}`);
  console.log(`Authorization: ${headers.Authorization.substring(0, 100)}...`);
  
  try {
    const response = await fetch(productUrl, {
      method: 'GET',
      headers: headers,
      timeout: 15000
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Product access successful!');
      
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
        console.log('Response length:', responseText.length);
        console.log('Response preview:', responseText.substring(0, 200));
        return true; // Still successful even if not JSON
      }
    } else {
      console.log('❌ Product access failed');
      console.log('Response:', responseText.substring(0, 300));
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

/**
 * Test various OAuth endpoints
 */
async function testOAuthEndpoints() {
  console.log('\n🔍 Testing various OAuth endpoints...');
  
  const endpoints = [
    `${config.baseUrl}/oauth/initiate`,
    `${config.baseUrl}/admin/oauth_authorize`,
    `${config.baseUrl}/oauth/token`,
    `${config.baseUrl}/index.php/oauth/initiate`,
    `${config.baseUrl}/index.php/admin/oauth_authorize`
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint}`);
    
    try {
      const headers = createOAuth1Headers('POST', endpoint + '?oauth_callback=http://example.com');
      
      const response = await fetch(endpoint + '?oauth_callback=http://example.com', {
        method: 'POST',
        headers: headers,
        timeout: 10000
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status !== 404) {
        const text = await response.text();
        console.log(`Response length: ${text.length} chars`);
        if (text.length < 200) {
          console.log(`Response: ${text}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Testing Magento OAuth 1.0 Authentication');
  console.log('Based on eGlobe IT Solutions article');
  console.log('='.repeat(60));
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Consumer Key: ${config.consumerKey}`);
  console.log(`Consumer Secret: ${config.consumerSecret.substring(0, 10)}...`);
  console.log('='.repeat(60));

  // Test 1: OAuth initiate
  const oauthTokens = await testOAuthInitiate();
  
  // Test 2: Direct product access (without tokens)
  await testDirectProductAccess();
  
  // Test 3: Direct product access (with tokens if available)
  if (oauthTokens) {
    await testDirectProductAccess(oauthTokens.token, oauthTokens.tokenSecret);
  }
  
  // Test 4: Various OAuth endpoints
  await testOAuthEndpoints();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  if (oauthTokens) {
    console.log('✅ OAuth 1.0 flow is supported');
    console.log('✅ Our integration approach is correct');
    console.log('👉 The Magento server supports OAuth 1.0 authentication');
  } else {
    console.log('❌ OAuth initiate endpoint not found');
    console.log('👉 Either OAuth is not enabled or endpoints are different');
    console.log('👉 Need to ask IT team about OAuth configuration');
  }
}

if (require.main === module) {
  main();
}











