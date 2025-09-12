#!/usr/bin/env node

/**
 * Test the AI cache endpoint directly to verify the fix
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

// Test email from previous script
const TEST_EMAIL_ID = 'AAMkAGQyYTlmNzNiLWJlMzMtNGIxMy04ZDc4LTM1NTMzOTU0OTAzOQBGAAAAAACA2cA14uuRR56XFaoM8tObBwBnw1LxIWESTpoE9YcUqWS_AAAAAAEMAABnw1LxIWESTpoE9YcUqWS_AATRs9F5AAA=';

async function testAICacheEndpoint() {
  console.log('🧪 Testing AI Cache Endpoint...');
  console.log(`🔗 Base URL: ${BASE_URL}`);
  
  try {
    // Test GET endpoint (check if cached)
    console.log('\n📥 Testing GET /api/emails/ai-cache...');
    const getUrl = `${BASE_URL}/api/emails/ai-cache?emailId=${encodeURIComponent(TEST_EMAIL_ID)}`;
    console.log(`🔗 GET URL: ${getUrl}`);
    
    const getResponse = await fetch(getUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const getResult = await getResponse.json();
    console.log(`📊 GET Status: ${getResponse.status}`);
    console.log(`📋 GET Result:`, getResult);
    
    // If no cache exists, test POST endpoint (trigger processing)
    if (!getResult.cached) {
      console.log('\n📤 Testing POST /api/emails/ai-cache...');
      const postUrl = `${BASE_URL}/api/emails/ai-cache`;
      
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailId: TEST_EMAIL_ID,
          forceReprocess: false,
          skipDraft: false
        })
      });
      
      const postResult = await postResponse.json();
      console.log(`📊 POST Status: ${postResponse.status}`);
      console.log(`📋 POST Result:`, postResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAICacheEndpoint();