/**
 * Email Direct Test Script
 * 
 * This script tests the email functionality directly by importing and using the 
 * MicrosoftGraphService class, bypassing the API authentication requirements.
 * 
 * Run with: node email-direct-test.js
 */

const readline = require('readline');
const { MicrosoftGraphService } = require('../lib/services/microsoft-graph-service');

// Configuration
const config = {
  userId: '', // Will be prompted
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

// Test functions
async function testFetchEmails(graphService) {
  console.log('\n=== Testing: Fetch Emails ===');
  
  try {
    const result = await graphService.getEmails({ top: 10 });
    
    if (result && Array.isArray(result)) {
      console.log(`✅ Success: Fetched ${result.length} emails`);
      
      // Save the first email ID for further tests
      if (result.length > 0) {
        config.emailId = result[0].id;
        console.log(`Using email ID for tests: ${config.emailId}`);
      } else {
        console.log('⚠️ Warning: No emails found');
      }
      
      return true;
    } else {
      console.log('❌ Error: Invalid response format');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testFetchEmailDetails(graphService) {
  console.log('\n=== Testing: Fetch Email Details ===');
  
  if (!config.emailId) {
    console.log('❌ Error: No email ID available');
    return false;
  }
  
  try {
    const result = await graphService.getEmail(config.emailId);
    
    if (result && result.id) {
      console.log(`✅ Success: Fetched email "${result.subject}"`);
      return true;
    } else {
      console.log('❌ Error: Invalid response format');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testMarkEmailReadUnread(graphService) {
  console.log('\n=== Testing: Mark Email as Read/Unread ===');
  
  if (!config.emailId) {
    console.log('❌ Error: No email ID available');
    return false;
  }
  
  try {
    // Mark as read
    await graphService.markAsRead(config.emailId);
    console.log('✅ Success: Marked email as read');
    
    // Mark as unread
    await graphService.markAsUnread(config.emailId);
    console.log('✅ Success: Marked email as unread');
    
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testSendEmail(graphService) {
  console.log('\n=== Testing: Send Email ===');
  
  const recipient = await prompt('Enter recipient email address: ');
  
  const emailData = {
    subject: 'Test Email from ARIS',
    body: {
      contentType: 'HTML',
      content: '<p>This is a test email sent from ARIS.</p>'
    },
    toRecipients: [{ emailAddress: { address: recipient } }]
  };
  
  try {
    await graphService.sendEmail(emailData);
    console.log('✅ Success: Sent test email');
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testDeleteEmail(graphService) {
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
  
  try {
    await graphService.deleteEmail(config.emailId);
    console.log('✅ Success: Deleted email');
    return true;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Email Direct Test Script ===');
  console.log('This script bypasses API authentication by using the MicrosoftGraphService directly.');
  
  // Get user ID
  config.userId = await prompt('Enter your user ID: ');
  
  // Create a mock session object with the user ID
  const mockSession = {
    user: {
      id: config.userId
    }
  };
  
  // Create Microsoft Graph Service instance
  const graphService = new MicrosoftGraphService(mockSession);
  
  // Run tests
  const tests = {
    fetchEmails: await testFetchEmails(graphService),
    fetchEmailDetails: await testFetchEmailDetails(graphService),
    markEmailReadUnread: await testMarkEmailReadUnread(graphService),
    sendEmail: await testSendEmail(graphService),
    deleteEmail: await testDeleteEmail(graphService)
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
