/**
 * Email Queue System Test Script
 * 
 * This script tests the email queue system functionality including:
 * - Adding emails to the queue
 * - Processing emails in the queue
 * - Reviewing emails that require manual review
 * - Getting queue statistics
 * - Cleaning up the queue
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const EMAIL_ID = process.env.EMAIL_ID || uuidv4(); // Use provided email ID or generate one
const CONTACT_ID = process.env.CONTACT_ID; // Must be provided in .env

// Validate required environment variables
if (!AUTH_TOKEN) {
  console.error('ERROR: AUTH_TOKEN environment variable is required');
  process.exit(1);
}

if (!CONTACT_ID) {
  console.error('ERROR: CONTACT_ID environment variable is required');
  process.exit(1);
}

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    throw error;
  }
}

// Test 1: Add an email to the queue
async function testAddEmailToQueue() {
  console.log('\n🧪 TEST 1: Adding email to queue');
  
  try {
    const result = await apiRequest('/api/email-queue', 'POST', {
      emailId: EMAIL_ID,
      contactId: CONTACT_ID,
      priority: 'high'
    });
    
    console.log('✅ Successfully added email to queue:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Failed to add email to queue:', error.message);
    throw error;
  }
}

// Test 2: Get queue statistics
async function testGetQueueStatistics() {
  console.log('\n🧪 TEST 2: Getting queue statistics');
  
  try {
    const stats = await apiRequest('/api/email-queue/stats', 'GET');
    
    console.log('✅ Queue statistics:');
    console.log(`   - Pending: ${stats.pending}`);
    console.log(`   - Processing: ${stats.processing}`);
    console.log(`   - Completed: ${stats.completed}`);
    console.log(`   - Failed: ${stats.failed}`);
    console.log(`   - Requires Review: ${stats.requiresReview}`);
    console.log(`   - Total: ${stats.total}`);
    console.log('   - Priority Distribution:', stats.priorityDistribution);
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get queue statistics:', error.message);
    throw error;
  }
}

// Test 3: Process emails in the queue
async function testProcessEmailQueue() {
  console.log('\n🧪 TEST 3: Processing emails in queue');
  
  try {
    const result = await apiRequest('/api/email-queue/process', 'POST', {
      batchSize: 5
    });
    
    console.log(`✅ Processed ${result.processed} emails:`);
    console.log(`   - Succeeded: ${result.succeeded}`);
    console.log(`   - Failed: ${result.failed}`);
    console.log(`   - Requires Review: ${result.requiresReview}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to process email queue:', error.message);
    throw error;
  }
}

// Test 4: Get emails requiring review
async function testGetEmailsRequiringReview() {
  console.log('\n🧪 TEST 4: Getting emails requiring review');
  
  try {
    const emails = await apiRequest('/api/email-queue/review', 'GET');
    
    console.log(`✅ Found ${emails.length} emails requiring review`);
    if (emails.length > 0) {
      console.log('   First email details:');
      console.log(`   - ID: ${emails[0].id}`);
      console.log(`   - Email ID: ${emails[0].email_id}`);
      console.log(`   - Status: ${emails[0].status}`);
      console.log(`   - Priority: ${emails[0].priority}`);
      
      // Save the first email for the next test
      return emails[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get emails requiring review:', error.message);
    throw error;
  }
}

// Test 5: Review an email (approve/reject)
async function testReviewEmail(queueItem) {
  if (!queueItem) {
    console.log('\n🧪 TEST 5: Skipping review test (no emails requiring review)');
    return null;
  }
  
  console.log('\n🧪 TEST 5: Reviewing email');
  
  try {
    const result = await apiRequest(`/api/email-queue/review/${queueItem.id}`, 'POST', {
      approved: true,
      feedback: 'This response looks good!'
    });
    
    console.log('✅ Successfully reviewed email:');
    console.log(`   - ID: ${result.id}`);
    console.log(`   - New Status: ${result.status}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to review email:', error.message);
    throw error;
  }
}

// Test 6: Reset failed queue items
async function testResetFailedItems() {
  console.log('\n🧪 TEST 6: Resetting failed queue items');
  
  try {
    const result = await apiRequest('/api/email-queue/reset-failed', 'POST', {
      maxAttempts: 3
    });
    
    console.log(`✅ Reset ${result.count} failed queue items`);
    return result;
  } catch (error) {
    console.error('❌ Failed to reset failed items:', error.message);
    throw error;
  }
}

// Test 7: Clean up old queue items
async function testCleanupOldItems() {
  console.log('\n🧪 TEST 7: Cleaning up old queue items');
  
  try {
    const result = await apiRequest('/api/email-queue/cleanup', 'POST', {
      olderThanDays: 30
    });
    
    console.log(`✅ Removed ${result.count} old queue items`);
    return result;
  } catch (error) {
    console.error('❌ Failed to clean up old items:', error.message);
    throw error;
  }
}

// Run all tests in sequence
async function runTests() {
  console.log('🚀 Starting Email Queue System Tests');
  console.log('======================================');
  
  try {
    // Run the tests in sequence
    const queueItem = await testAddEmailToQueue();
    await testGetQueueStatistics();
    await testProcessEmailQueue();
    const reviewItem = await testGetEmailsRequiringReview();
    await testReviewEmail(reviewItem);
    await testResetFailedItems();
    await testCleanupOldItems();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
