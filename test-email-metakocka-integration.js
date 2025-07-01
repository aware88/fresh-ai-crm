/**
 * Test script for email-Metakocka integration
 * 
 * This script tests:
 * 1. Processing a single email for Metakocka metadata
 * 2. Batch processing of unprocessed emails
 * 3. Retrieving email Metakocka metadata
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update EMAIL_ID with an actual email ID from the database
 * - Update SERVICE_TOKEN for service-level operations
 */

// Configuration - Replace these values with your actual data
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN';
const EMAIL_ID = 'YOUR_EMAIL_ID';
const USER_ID = 'YOUR_USER_ID';
const SERVICE_TOKEN = 'YOUR_SERVICE_TOKEN';
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function callApi(endpoint, method = 'GET', body = null, useServiceToken = false) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useServiceToken) {
    headers['X-Service-Token'] = SERVICE_TOKEN;
  } else {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    console.log(`\n🔄 Calling ${method} ${endpoint}...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error(data);
      return { success: false, error: data };
    }
    
    console.log(`✅ Success: ${response.status} ${response.statusText}`);
    console.log(JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 1: Process a single email for Metakocka metadata
async function testProcessSingleEmail() {
  console.log('\n==== TEST 1: Process Single Email for Metakocka Metadata ====');
  return await callApi('/emails/metakocka', 'POST', { emailId: EMAIL_ID });
}

// Test 2: Batch process unprocessed emails
async function testBatchProcessEmails() {
  console.log('\n==== TEST 2: Batch Process Unprocessed Emails ====');
  return await callApi('/emails/metakocka', 'POST', { processBatch: true, limit: 5 });
}

// Test 3: Retrieve email Metakocka metadata
async function testGetEmailMetadata() {
  console.log('\n==== TEST 3: Get Email Metakocka Metadata ====');
  return await callApi(`/emails/metakocka?emailId=${EMAIL_ID}`, 'GET');
}

// Test 4: Process email with service token
async function testProcessWithServiceToken() {
  console.log('\n==== TEST 4: Process Email with Service Token ====');
  return await callApi('/emails/metakocka', 'POST', { emailId: EMAIL_ID, userId: USER_ID }, true);
}

// Run all tests in sequence
async function runAllTests() {
  console.log('🚀 Starting Email-Metakocka Integration Tests...');
  
  try {
    // Test 1: Process a single email
    const test1Result = await testProcessSingleEmail();
    if (!test1Result.success) {
      console.log('⚠️ Test 1 failed, but continuing with other tests...');
    }
    
    // Test 2: Batch process emails
    const test2Result = await testBatchProcessEmails();
    if (!test2Result.success) {
      console.log('⚠️ Test 2 failed, but continuing with other tests...');
    }
    
    // Test 3: Get email metadata
    const test3Result = await testGetEmailMetadata();
    if (!test3Result.success) {
      console.log('⚠️ Test 3 failed, but continuing with other tests...');
    }
    
    // Test 4: Process with service token
    const test4Result = await testProcessWithServiceToken();
    if (!test4Result.success) {
      console.log('⚠️ Test 4 failed, but continuing with other tests...');
    }
    
    console.log('\n🏁 All tests completed!');
  } catch (error) {
    console.error(`\n❌ Test suite failed: ${error.message}`);
  }
}

// Run the tests
runAllTests();

/**
 * Manual test commands (for reference):
 * 
 * 1. Process a single email:
 * curl -X POST http://localhost:3000/api/emails/metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"emailId": "YOUR_EMAIL_ID"}'
 * 
 * 2. Batch process emails:
 * curl -X POST http://localhost:3000/api/emails/metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"processBatch": true, "limit": 5}'
 * 
 * 3. Get email metadata:
 * curl -X GET "http://localhost:3000/api/emails/metakocka?emailId=YOUR_EMAIL_ID" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 4. Process with service token:
 * curl -X POST http://localhost:3000/api/emails/metakocka \
 *   -H "X-Service-Token: YOUR_SERVICE_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"emailId": "YOUR_EMAIL_ID", "userId": "YOUR_USER_ID"}'
 */
