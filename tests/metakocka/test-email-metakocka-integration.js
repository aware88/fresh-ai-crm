/**
 * Test Script for Metakocka Email/AI Integration
 * 
 * This script tests the integration between the email system, AI processing,
 * and Metakocka data enrichment. It verifies that emails can be properly
 * enriched with Metakocka data, AI can generate appropriate responses using
 * this data, and templates can be populated with Metakocka context.
 * 
 * Tests:
 * 1. Email context enrichment with Metakocka data
 * 2. AI response generation with Metakocka context
 * 3. Template population with Metakocka data
 * 4. Full email processing flow with Metakocka integration
 * 
 * Before running:
 * - Copy email-metakocka-test.env.sample to .env
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update EMAIL_ID with an actual email ID from the database
 * - Update CONTACT_ID with a contact that has Metakocka mapping
 * - Run using the shell script: ./run-email-metakocka-test.sh
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN';
const EMAIL_ID = process.env.EMAIL_ID || 'YOUR_EMAIL_ID';
const CONTACT_ID = process.env.CONTACT_ID || 'YOUR_CONTACT_ID';

// Test tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data, success: response.status >= 200 && response.status < 300 };
  } catch (error) {
    console.error('Error:', error.message);
    return { status: 500, data: { error: error.message }, success: false };
  }
}

// Test functions
async function testEmailMetakockaEnrichment() {
  console.log('\n===== TEST 1: Email Context Enrichment with Metakocka Data =====');
  return apiRequest(`/api/emails/${EMAIL_ID}/metakocka-context`);
}

async function testAIResponseWithMetakockaContext() {
  console.log('\n===== TEST 2: AI Response Generation with Metakocka Context =====');
  return apiRequest('/api/ai/generate-response', 'POST', {
    emailId: EMAIL_ID,
    includeMetakockaData: true,
    prompt: 'Generate a response about product availability and pricing'
  });
}

async function testTemplateWithMetakockaData() {
  console.log('\n===== TEST 3: Template Population with Metakocka Data =====');
  return apiRequest('/api/emails/templates/populate', 'POST', {
    templateId: 'product_inquiry',
    contactId: CONTACT_ID,
    includeMetakockaData: true
  });
}

async function testFullEmailFlow() {
  console.log('\n===== TEST 4: Full Email Processing Flow with Metakocka Integration =====');
  
  // Step 1: Create a draft email with Metakocka context
  const draftResponse = await apiRequest('/api/emails/draft', 'POST', {
    contactId: CONTACT_ID,
    subject: 'Product Inquiry Test',
    includeMetakockaData: true
  });
  
  if (!draftResponse.success) {
    return draftResponse;
  }
  
  const draftId = draftResponse.data.id;
  
  // Step 2: Generate AI response with Metakocka context
  const aiResponse = await apiRequest(`/api/emails/${draftId}/ai-response`, 'POST', {
    includeMetakockaData: true
  });
  
  if (!aiResponse.success) {
    return aiResponse;
  }
  
  // Step 3: Send the email
  return apiRequest(`/api/emails/${draftId}/send`, 'POST');
}

// Helper function to record test results
function recordTestResult(testNumber, testName, result) {
  const success = result.success;
  const status = success ? '✅ PASSED' : '❌ FAILED';
  
  console.log(`\n${status}: Test ${testNumber} - ${testName}`);
  
  if (!success) {
    console.error(`Error: ${result.data.error || 'Unknown error'}`);
  }
  
  testResults.details.push({
    number: testNumber,
    name: testName,
    status: success ? 'passed' : 'failed',
    error: !success ? (result.data.error || 'Unknown error') : null
  });
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  return success;
}

// Helper function to record skipped tests
function recordSkippedTest(testNumber, testName, reason) {
  console.log(`\n⏭️ SKIPPED: Test ${testNumber} - ${testName}`);
  console.log(`   Reason: ${reason}`);
  
  testResults.details.push({
    number: testNumber,
    name: testName,
    status: 'skipped',
    reason
  });
  
  testResults.skipped++;
}

// Run all tests
async function runTests() {
  try {
    console.log('🚀 Starting Metakocka Email Integration Tests');
    console.log(`🌐 API Base URL: ${BASE_URL}`);
    
    // Validate required parameters
    if (!AUTH_TOKEN || AUTH_TOKEN === 'YOUR_AUTH_TOKEN') {
      console.error('❌ ERROR: AUTH_TOKEN environment variable is required');
      process.exit(1);
    }
    
    if (!EMAIL_ID || EMAIL_ID === 'YOUR_EMAIL_ID') {
      console.error('❌ ERROR: EMAIL_ID environment variable is required');
      process.exit(1);
    }
    
    if (!CONTACT_ID || CONTACT_ID === 'YOUR_CONTACT_ID') {
      console.error('❌ ERROR: CONTACT_ID environment variable is required');
      process.exit(1);
    }
    
    // Test 1: Email context enrichment with Metakocka data
    const test1Result = await testEmailMetakockaEnrichment();
    recordTestResult(1, 'Email Context Enrichment with Metakocka Data', test1Result);
    
    // Test 2: AI response generation with Metakocka context
    const test2Result = await testAIResponseWithMetakockaContext();
    recordTestResult(2, 'AI Response Generation with Metakocka Context', test2Result);
    
    // Test 3: Template population with Metakocka data
    const test3Result = await testTemplateWithMetakockaData();
    recordTestResult(3, 'Template Population with Metakocka Data', test3Result);
    
    // Test 4: Full email processing flow with Metakocka integration
    const test4Result = await testFullEmailFlow();
    recordTestResult(4, 'Full Email Processing Flow with Metakocka Integration', test4Result);
    
    // Print test summary
    printTestSummary();
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    process.exit(1);
  }
}

// Print test summary
function printTestSummary() {
  console.log('\n============================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log(`🔢 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  console.log('============================================');
  
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Please check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests completed successfully!');
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`\n❌ Unhandled error: ${error.message}`);
  process.exit(1);
});

/**
 * Manual curl commands for testing:
 * 
 * 1. Email Context Enrichment with Metakocka Data:
 * curl -X GET "http://localhost:3000/api/emails/YOUR_EMAIL_ID/metakocka-context" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 2. AI Response Generation with Metakocka Context:
 * curl -X POST http://localhost:3000/api/ai/generate-response \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"emailId":"YOUR_EMAIL_ID","includeMetakockaData":true,"prompt":"Generate a response about product availability and pricing"}'
 * 
 * 3. Template Population with Metakocka Data:
 * curl -X POST http://localhost:3000/api/emails/templates/populate \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"templateId":"product_inquiry","contactId":"YOUR_CONTACT_ID","includeMetakockaData":true}'
 * 
 * 4. Full Email Flow (multiple steps):
 * # Step 1: Create draft
 * curl -X POST http://localhost:3000/api/emails/draft \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"contactId":"YOUR_CONTACT_ID","subject":"Product Inquiry Test","includeMetakockaData":true}'
 * 
 * # Step 2: Generate AI response
 * curl -X POST "http://localhost:3000/api/emails/DRAFT_ID/ai-response" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"includeMetakockaData":true}'
 * 
 * # Step 3: Send email
 * curl -X POST "http://localhost:3000/api/emails/DRAFT_ID/send" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 */
