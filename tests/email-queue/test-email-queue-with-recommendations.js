/**
 * Email Queue with Product Recommendations Test Script
 * 
 * This script tests the email queue system with product recommendations integration.
 * It verifies that emails are processed correctly and product recommendations are included.
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const EMAIL_ID = process.env.EMAIL_ID;
const CONTACT_ID = process.env.CONTACT_ID;

// Validation
if (!AUTH_TOKEN) {
  console.error('❌ Error: AUTH_TOKEN is required. Please set it in your .env file.');
  process.exit(1);
}

if (!EMAIL_ID) {
  console.error('❌ Error: EMAIL_ID is required. Please set it in your .env file.');
  process.exit(1);
}

if (!CONTACT_ID) {
  console.error('❌ Error: CONTACT_ID is required. Please set it in your .env file.');
  process.exit(1);
}

// Test tracking
const tests = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const text = await response.text();
      try {
        return { error: JSON.parse(text), status: response.status };
      } catch (e) {
        return { error: text, status: response.status };
      }
    }
    
    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    return { error: error.message, status: 0 };
  }
}

// Test function
async function runTest(name, testFn) {
  tests.total++;
  console.log(`\n🧪 Running test: ${name}`);
  
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    tests.passed++;
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    tests.failed++;
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Email Queue with Product Recommendations Tests');
  
  // Test 1: Add email to queue
  await runTest('Add email to queue', async () => {
    const { data, error, status } = await apiRequest('/email-queue', {
      method: 'POST',
      body: JSON.stringify({
        emailId: EMAIL_ID,
        contactId: CONTACT_ID,
        priority: 'high'
      })
    });
    
    if (error) throw new Error(`Failed to add email to queue: ${JSON.stringify(error)}`);
    if (!data.id) throw new Error('No queue item ID returned');
    
    console.log(`   Queue item created with ID: ${data.id}`);
    process.env.QUEUE_ITEM_ID = data.id;
  });
  
  // Test 2: Process queue with recommendations
  await runTest('Process queue with recommendations', async () => {
    const { data, error, status } = await apiRequest('/email-queue/process-with-recommendations', {
      method: 'POST',
      body: JSON.stringify({
        batchSize: 5
      })
    });
    
    if (error) throw new Error(`Failed to process queue: ${JSON.stringify(error)}`);
    if (data.processed === 0) throw new Error('No emails were processed');
    
    console.log(`   Processed ${data.processed} emails`);
    console.log(`   Succeeded: ${data.succeeded}`);
    console.log(`   Failed: ${data.failed}`);
    console.log(`   Requires review: ${data.requiresReview}`);
    console.log(`   With recommendations: ${data.withRecommendations}`);
  });
  
  // Test 3: Get queue items and verify recommendations
  await runTest('Verify product recommendations', async () => {
    const { data, error, status } = await apiRequest('/email-queue');
    
    if (error) throw new Error(`Failed to get queue items: ${JSON.stringify(error)}`);
    if (!data || !data.length) throw new Error('No queue items returned');
    
    // Find our processed item
    const queueItem = data.find(item => item.email_id === EMAIL_ID);
    if (!queueItem) throw new Error(`Queue item for email ${EMAIL_ID} not found`);
    
    console.log(`   Queue item status: ${queueItem.status}`);
    
    // Check for recommendations
    if (!queueItem.metadata || !queueItem.metadata.product_recommendations) {
      throw new Error('No product recommendations found in queue item metadata');
    }
    
    const recommendations = queueItem.metadata.product_recommendations;
    console.log(`   Found ${recommendations.products.length} product recommendations`);
    
    // Verify recommendation structure
    if (!recommendations.products || !Array.isArray(recommendations.products)) {
      throw new Error('Invalid product recommendations structure');
    }
    
    // Log some details about the recommendations
    recommendations.products.forEach((product, index) => {
      console.log(`   Recommendation ${index + 1}: ${product.name} (${product.price})`);
    });
  });
  
  // Print test summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total tests: ${tests.total}`);
  console.log(`   Passed: ${tests.passed}`);
  console.log(`   Failed: ${tests.failed}`);
  console.log(`   Skipped: ${tests.skipped}`);
  
  if (tests.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
