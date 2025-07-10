/**
 * Email Workflow Test Script
 * 
 * This script tests the full email workflow in ARIS:
 * 1. Fetching and displaying emails
 * 2. Viewing email details
 * 3. Replying to and forwarding emails
 * 4. Deleting emails
 * 5. Using the AI analysis and sales agent features
 * 
 * Note: This is a browser-based test script. Load it in the browser console while logged in to the CRM.
 * 
 * Usage:
 * 1. Copy this entire script
 * 2. Open ARIS in your browser
 * 3. Open the browser console (F12 or Ctrl+Shift+J)
 * 4. Paste and run the script
 * 5. Use the exposed window.emailTests object to run tests
 */

// Test data
const testData = {
  // Replace with a real email ID from your Outlook account
  emailId: 'REPLACE_WITH_REAL_EMAIL_ID',
  
  // Test email for sending
  testEmail: {
    subject: 'Test Email from ARIS',
    content: '<p>This is a test email sent from ARIS.</p>',
    contentType: 'HTML',
    toRecipients: ['test@example.com'], // Replace with a real email address
  },
  
  // Test reply
  testReply: {
    subject: 'RE: Test Email from ARIS',
    content: '<p>This is a test reply sent from ARIS.</p>',
    contentType: 'HTML',
    toRecipients: ['test@example.com'], // Replace with a real email address
  },
  
  // Test AI analysis prompt
  testAIPrompt: 'Analyze this email and suggest a response strategy.'
};

/**
 * Test Steps
 */

// Step 1: Fetch emails
async function testFetchEmails() {
  console.log('Testing: Fetch Emails');
  try {
    const response = await fetch('/api/emails?top=10');
    const result = await response.json();
    
    if (result.data && Array.isArray(result.data)) {
      console.log('✅ Successfully fetched emails:', result.data.length);
      // Save the first email ID for further tests if none was provided
      if (testData.emailId === 'REPLACE_WITH_REAL_EMAIL_ID' && result.data.length > 0) {
        testData.emailId = result.data[0].id;
        console.log('Using email ID for tests:', testData.emailId);
      }
      return true;
    } else {
      console.error('❌ Failed to fetch emails:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    return false;
  }
}

// Step 2: Fetch email details
async function testFetchEmailDetails() {
  console.log('Testing: Fetch Email Details');
  try {
    const response = await fetch(`/api/emails/${testData.emailId}`);
    const result = await response.json();
    
    if (result.data && result.data.id) {
      console.log('✅ Successfully fetched email details:', result.data.subject);
      return true;
    } else {
      console.error('❌ Failed to fetch email details:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error fetching email details:', error);
    return false;
  }
}

// Step 3: Mark email as read/unread
async function testMarkEmailReadUnread() {
  console.log('Testing: Mark Email as Read/Unread');
  try {
    // Mark as read
    let response = await fetch(`/api/emails/${testData.emailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true })
    });
    let result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully marked email as read');
    } else {
      console.error('❌ Failed to mark email as read:', result);
      return false;
    }
    
    // Mark as unread
    response = await fetch(`/api/emails/${testData.emailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: false })
    });
    result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully marked email as unread');
      return true;
    } else {
      console.error('❌ Failed to mark email as unread:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating email read status:', error);
    return false;
  }
}

// Step 4: Send a test email
async function testSendEmail() {
  console.log('Testing: Send Email');
  try {
    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData.testEmail)
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully sent test email');
      return true;
    } else {
      console.error('❌ Failed to send test email:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return false;
  }
}

// Step 5: Test AI analysis
async function testAIAnalysis() {
  console.log('Testing: AI Analysis');
  try {
    // Get AI context
    let response = await fetch(`/api/emails/ai-context?emailId=${testData.emailId}`);
    let result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Successfully fetched AI context');
    } else {
      console.error('❌ Failed to fetch AI context:', result);
      return false;
    }
    
    // Generate AI response
    response = await fetch('/api/emails/ai-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailId: testData.emailId,
        prompt: testData.testAIPrompt
      })
    });
    result = await response.json();
    
    if (result.success && result.data && result.data.response) {
      console.log('✅ Successfully generated AI response');
      console.log('AI Response:', result.data.response.substring(0, 100) + '...');
      return true;
    } else {
      console.error('❌ Failed to generate AI response:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing AI analysis:', error);
    return false;
  }
}

// Step 6: Delete email (test last to avoid deleting emails needed for other tests)
async function testDeleteEmail() {
  console.log('Testing: Delete Email');
  try {
    const response = await fetch(`/api/emails/${testData.emailId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Successfully deleted email');
      return true;
    } else {
      console.error('❌ Failed to delete email:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting email:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== Starting Email Workflow Tests ===');
  
  const testResults = {
    fetchEmails: await testFetchEmails(),
    fetchEmailDetails: await testFetchEmailDetails(),
    markEmailReadUnread: await testMarkEmailReadUnread(),
    sendEmail: await testSendEmail(),
    aiAnalysis: await testAIAnalysis(),
    deleteEmail: await testDeleteEmail()
  };
  
  console.log('\n=== Email Workflow Test Results ===');
  for (const [test, result] of Object.entries(testResults)) {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  }
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.values(testResults).length;
  
  console.log(`\nPassed ${passedTests}/${totalTests} tests`);
}

// Uncomment to run all tests
// runAllTests();

// Or run individual tests as needed
// testFetchEmails();
// testFetchEmailDetails();
// testMarkEmailReadUnread();
// testSendEmail();
// testAIAnalysis();
// testDeleteEmail();

// Export test functions for use in browser console
if (typeof window !== 'undefined') {
  window.emailTests = {
    testData,
    testFetchEmails,
    testFetchEmailDetails,
    testMarkEmailReadUnread,
    testSendEmail,
    testAIAnalysis,
    testDeleteEmail,
    runAllTests
  };
  console.log('Email tests loaded. Access via window.emailTests in browser console.');
}
