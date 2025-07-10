/**
 * Email API Test Script
 * 
 * This script tests the email API endpoints in ARIS.
 * Run with: node email-api-test.js
 */

const fetch = require('node-fetch');
const readline = require('readline');

// Configuration
const config = {
  baseUrl: 'http://localhost:3002',
  accessToken: '', // Will be prompted for this
  emailId: '', // Will be auto-populated or prompted
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function for API calls
async function callApi(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.accessToken}`
  };
  
  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };
  
  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test functions
async function testFetchEmails() {
  console.log('\n=== Testing: Fetch Emails ===');
  
  const result = await callApi('/api/emails?top=10');
  
  if (result.success && result.data.data && Array.isArray(result.data.data)) {
    console.log(`✅ Success: Fetched ${result.data.data.length} emails`);
    
    // Save the first email ID for further tests
    if (result.data.data.length > 0) {
      config.emailId = result.data.data[0].id;
      console.log(`Using email ID for tests: ${config.emailId}`);
    } else {
      console.log('⚠️ Warning: No emails found');
    }
    
    return true;
  } else {
    console.log('❌ Error:', result.error || JSON.stringify(result.data));
    return false;
  }
}

async function testFetchEmailDetails() {
  console.log('\n=== Testing: Fetch Email Details ===');
  
  if (!config.emailId) {
    console.log('❌ Error: No email ID available');
    return false;
  }
  
  const result = await callApi(`/api/emails/${config.emailId}`);
  
  if (result.success && result.data.data) {
    console.log(`✅ Success: Fetched email "${result.data.data.subject}"`);
    return true;
  } else {
    console.log('❌ Error:', result.error || JSON.stringify(result.data));
    return false;
  }
}

async function testMarkEmailReadUnread() {
  console.log('\n=== Testing: Mark Email as Read/Unread ===');
  
  if (!config.emailId) {
    console.log('❌ Error: No email ID available');
    return false;
  }
  
  // Mark as read
  let result = await callApi(`/api/emails/${config.emailId}`, 'PATCH', { isRead: true });
  
  if (result.success) {
    console.log('✅ Success: Marked email as read');
  } else {
    console.log('❌ Error marking as read:', result.error || JSON.stringify(result.data));
    return false;
  }
  
  // Mark as unread
  result = await callApi(`/api/emails/${config.emailId}`, 'PATCH', { isRead: false });
  
  if (result.success) {
    console.log('✅ Success: Marked email as unread');
    return true;
  } else {
    console.log('❌ Error marking as unread:', result.error || JSON.stringify(result.data));
    return false;
  }
}

async function testSendEmail() {
  console.log('\n=== Testing: Send Email ===');
  
  const recipient = await prompt('Enter recipient email address: ');
  
  const emailData = {
    subject: 'Test Email from ARIS',
    content: '<p>This is a test email sent from ARIS.</p>',
    contentType: 'HTML',
    toRecipients: [recipient]
  };
  
  const result = await callApi('/api/emails/send', 'POST', emailData);
  
  if (result.success) {
    console.log('✅ Success: Sent test email');
    return true;
  } else {
    console.log('❌ Error:', result.error || JSON.stringify(result.data));
    return false;
  }
}

async function testAIAnalysis() {
  console.log('\n=== Testing: AI Analysis ===');
  
  if (!config.emailId) {
    console.log('❌ Error: No email ID available');
    return false;
  }
  
  // Get AI context
  let result = await callApi(`/api/emails/ai-context?emailId=${config.emailId}`);
  
  if (result.success && result.data.data) {
    console.log('✅ Success: Fetched AI context');
  } else {
    console.log('❌ Error fetching AI context:', result.error || JSON.stringify(result.data));
    return false;
  }
  
  // Generate AI response
  result = await callApi('/api/emails/ai-context', 'POST', {
    emailId: config.emailId,
    prompt: 'Analyze this email and suggest a response strategy.'
  });
  
  if (result.success && result.data.data && result.data.data.response) {
    console.log('✅ Success: Generated AI response');
    console.log('AI Response:', result.data.data.response.substring(0, 100) + '...');
    return true;
  } else {
    console.log('❌ Error generating AI response:', result.error || JSON.stringify(result.data));
    return false;
  }
}

async function testDeleteEmail() {
  console.log('\n=== Testing: Delete Email ===');
  
  if (!config.emailId) {
    console.log('❌ Error: No email ID available');
    return false;
  }
  
  const confirm = await prompt(`Are you sure you want to delete email ${config.emailId}? (y/n): `);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('⏭️ Skipped: Delete email test');
    return true;
  }
  
  const result = await callApi(`/api/emails/${config.emailId}`, 'DELETE');
  
  if (result.success) {
    console.log('✅ Success: Deleted email');
    return true;
  } else {
    console.log('❌ Error:', result.error || JSON.stringify(result.data));
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Email API Test Script ===');
  
  // Get access token
  config.accessToken = await prompt('Enter your access token: ');
  
  // Run tests
  const tests = {
    fetchEmails: await testFetchEmails(),
    fetchEmailDetails: await testFetchEmailDetails(),
    markEmailReadUnread: await testMarkEmailReadUnread(),
    sendEmail: await testSendEmail(),
    aiAnalysis: await testAIAnalysis(),
    deleteEmail: await testDeleteEmail()
  };
  
  // Print summary
  console.log('\n=== Test Summary ===');
  for (const [test, result] of Object.entries(tests)) {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  }
  
  const passedTests = Object.values(tests).filter(Boolean).length;
  const totalTests = Object.values(tests).length;
  
  console.log(`\nPassed ${passedTests}/${totalTests} tests`);
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error('Error running tests:', error);
  rl.close();
});
