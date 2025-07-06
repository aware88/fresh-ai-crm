/**
 * Email Queue System Test Script
 * 
 * This script tests the email queue system functionality, including:
 * - Adding emails to the queue
 * - Processing queued emails
 * - Reviewing emails requiring manual review
 * - Queue statistics and management
 */

require('dotenv').config({ path: '.env.test' });
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Test tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Test data
let testEmailId;
let testContactId;
let testQueueItemId;

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n🧪 STARTING EMAIL QUEUE SYSTEM TESTS 🧪\n');
  
  try {
    // Setup test data
    await setupTestData();
    
    // Run tests in sequence
    await testAddEmailToQueue();
    await testGetQueueItems();
    await testProcessQueuedEmail();
    await testGetEmailsRequiringReview();
    await testReviewEmailResponse();
    await testQueueStatistics();
    await testResetFailedQueueItems();
    await testCleanupOldQueueItems();
    
    // Clean up test data
    await cleanupTestData();
    
    // Print test summary
    printTestSummary();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('Setting up test data...');
  
  try {
    // Create a test contact
    const contactResponse = await axios.post(
      `${API_BASE_URL}/contacts`,
      {
        firstname: 'Test',
        lastname: 'Contact',
        email: `test-${uuidv4().substring(0, 8)}@example.com`,
        company: 'Test Company'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    testContactId = contactResponse.data.contact.id;
    console.log(`Created test contact with ID: ${testContactId}`);
    
    // Create a test email
    const emailResponse = await axios.post(
      `${API_BASE_URL}/emails`,
      {
        sender: `sender-${uuidv4().substring(0, 8)}@example.com`,
        recipient: `recipient-${uuidv4().substring(0, 8)}@example.com`,
        subject: 'Test Email for Queue',
        raw_content: 'This is a test email for the queue system. Please process this email.',
        contact_id: testContactId
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    testEmailId = emailResponse.data.email.id;
    console.log(`Created test email with ID: ${testEmailId}`);
    
  } catch (error) {
    console.error('Error setting up test data:', error.response?.data || error.message);
    throw new Error('Failed to set up test data');
  }
}

/**
 * Test adding an email to the queue
 */
async function testAddEmailToQueue() {
  const testName = '1️⃣ Add Email to Queue';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/email/queue`,
      {
        emailId: testEmailId,
        contactId: testContactId,
        priority: 'high'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    testQueueItemId = response.data.queueItem.id;
    
    if (response.status === 200 && testQueueItemId) {
      console.log(`✅ ${testName}: PASSED`);
      console.log(`   Queue item created with ID: ${testQueueItemId}`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test getting queue items
 */
async function testGetQueueItems() {
  const testName = '2️⃣ Get Queue Items';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/email/queue`,
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    if (response.status === 200 && Array.isArray(response.data.queueItems)) {
      const queueItems = response.data.queueItems;
      const foundItem = queueItems.find(item => item.id === testQueueItemId);
      
      if (foundItem) {
        console.log(`✅ ${testName}: PASSED`);
        console.log(`   Found ${queueItems.length} queue items, including our test item`);
        testResults.passed++;
        return true;
      } else {
        throw new Error('Test queue item not found in results');
      }
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test processing a queued email
 */
async function testProcessQueuedEmail() {
  const testName = '3️⃣ Process Queued Email';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.put(
      `${API_BASE_URL}/email/queue/${testQueueItemId}`,
      {
        action: 'process'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    if (response.status === 200 && response.data.result) {
      console.log(`✅ ${testName}: PASSED`);
      console.log(`   Email processed with status: ${response.data.result.status}`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test getting emails requiring review
 */
async function testGetEmailsRequiringReview() {
  const testName = '4️⃣ Get Emails Requiring Review';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/email/queue?status=review`,
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    if (response.status === 200 && Array.isArray(response.data.queueItems)) {
      console.log(`✅ ${testName}: PASSED`);
      console.log(`   Found ${response.data.queueItems.length} emails requiring review`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test reviewing an email response
 */
async function testReviewEmailResponse() {
  const testName = '5️⃣ Review Email Response';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.put(
      `${API_BASE_URL}/email/queue/${testQueueItemId}`,
      {
        action: 'review',
        approved: true,
        feedback: 'This is a good response.'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    if (response.status === 200 && response.data.queueItem) {
      console.log(`✅ ${testName}: PASSED`);
      console.log(`   Email reviewed with status: ${response.data.queueItem.status}`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test queue statistics
 */
async function testQueueStatistics() {
  const testName = '6️⃣ Queue Statistics';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/email/queue/process`,
      {
        action: 'stats'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    if (response.status === 200 && response.data.stats) {
      console.log(`✅ ${testName}: PASSED`);
      console.log(`   Queue statistics: ${JSON.stringify(response.data.stats)}`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test resetting failed queue items
 */
async function testResetFailedQueueItems() {
  const testName = '7️⃣ Reset Failed Queue Items';
  testResults.total++;
  
  try {
    console.log(`\nRunning test: ${testName}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/email/queue/process`,
      {
        action: 'reset_failed',
        maxAttempts: 3
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    
    if (response.status === 200) {
      console.log(`✅ ${testName}: PASSED`);
      console.log(`   Reset ${response.data.resetCount} failed queue items`);
      testResults.passed++;
      return true;
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error(`❌ ${testName}: FAILED`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    testResults.failed++;
    return false;
  }
}

/**
 * Test cleaning up old queue items
 */
async function testCleanupOldQueueItems() {
  const testName = '8️⃣ Cleanup Old Queue Items';
  testResults.total++;
  
  // This test is informational only since we don't have old items to clean up
  console.log(`\nRunning test: ${testName}`);
  console.log(`⏭️ ${testName}: SKIPPED (No old items to clean up)`);
  testResults.skipped++;
  return true;
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('\nCleaning up test data...');
  
  try {
    // Delete the test queue item
    if (testQueueItemId) {
      await axios.delete(
        `${API_BASE_URL}/email/queue/${testQueueItemId}`,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`Deleted test queue item: ${testQueueItemId}`);
    }
    
    // Delete the test email
    if (testEmailId) {
      await axios.delete(
        `${API_BASE_URL}/emails/${testEmailId}`,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`Deleted test email: ${testEmailId}`);
    }
    
    // Delete the test contact
    if (testContactId) {
      await axios.delete(
        `${API_BASE_URL}/contacts/${testContactId}`,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`Deleted test contact: ${testContactId}`);
    }
    
    console.log('Test data cleanup complete.');
  } catch (error) {
    console.error('Error cleaning up test data:', error.response?.data || error.message);
    // Don't throw here, as we want the test results to be reported
  }
}

/**
 * Print test summary
 */
function printTestSummary() {
  console.log('\n📊 TEST SUMMARY 📊');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run the tests
runTests();
