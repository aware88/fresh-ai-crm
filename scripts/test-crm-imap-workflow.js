const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  email: 'tim.mak@bulknutrition.eu',
  name: 'Tim Mak Test Account',
  password: 'BulkBulk123!',
  imapHost: 'mail.bulknutrition.eu',
  imapPort: 993,
  imapSecurity: 'SSL/TLS',
  username: 'tim.mak@bulknutrition.eu',
  smtpHost: 'mail.bulknutrition.eu',
  smtpPort: 587,
  smtpSecurity: 'STARTTLS'
};

const BASE_URL = 'http://localhost:3000';

let createdAccountId = null;

async function testConnection() {
  console.log('🧪 Testing IMAP connection through CRM test API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/email/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: TEST_CONFIG.imapHost,
        port: TEST_CONFIG.imapPort,
        secure: TEST_CONFIG.imapSecurity === 'SSL/TLS',
        username: TEST_CONFIG.username,
        password: TEST_CONFIG.password
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Connection test successful!');
      return true;
    } else {
      console.log('❌ Connection test failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection test error:', error.message);
    return false;
  }
}

async function addImapAccount() {
  console.log('\n📧 Adding IMAP account through CRM API...');
  
  try {
    // First get a session (simulate authenticated user)
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();
    
    if (!sessionData?.user?.id) {
      console.log('❌ No authenticated session found. Please ensure you are logged in to the CRM.');
      return null;
    }
    
    console.log(`   Using session for user: ${sessionData.user.id}`);
    
    const accountData = {
      userId: sessionData.user.id,
      email: TEST_CONFIG.email,
      name: TEST_CONFIG.name,
      providerType: 'imap',
      imapHost: TEST_CONFIG.imapHost,
      imapPort: parseInt(TEST_CONFIG.imapPort),
      imapSecurity: TEST_CONFIG.imapSecurity,
      username: TEST_CONFIG.username,
      password: TEST_CONFIG.password,
      smtpHost: TEST_CONFIG.smtpHost,
      smtpPort: parseInt(TEST_CONFIG.smtpPort),
      smtpSecurity: TEST_CONFIG.smtpSecurity,
      isActive: true,
    };

    const response = await fetch(`${BASE_URL}/api/auth/imap/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
      credentials: 'include',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ IMAP account added successfully!');
      console.log(`   Account ID: ${data.accountId}`);
      return data.accountId;
    } else {
      console.log('❌ Failed to add IMAP account:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error adding IMAP account:', error.message);
    return null;
  }
}

async function fetchEmails(accountId) {
  console.log('\n📬 Fetching emails through CRM IMAP API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/email/imap-fetch?accountId=${accountId}&maxEmails=5`, {
      credentials: 'include',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Successfully fetched ${data.count} emails from ${data.account}!`);
      
      if (data.emails && data.emails.length > 0) {
        console.log('\n📨 Recent emails:');
        data.emails.slice(0, 3).forEach((email, index) => {
          console.log(`   ${index + 1}. From: ${email.from}`);
          console.log(`      Subject: ${email.subject}`);
          console.log(`      Date: ${new Date(email.date).toLocaleDateString()}`);
          console.log(`      Read: ${email.read ? 'Yes' : 'No'}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Failed to fetch emails:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error fetching emails:', error.message);
    return false;
  }
}

async function checkEmailAccounts() {
  console.log('\n📋 Checking email accounts status...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/email/status`, {
      credentials: 'include',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Email status check successful!`);
      console.log(`   Total accounts: ${data.totalAccounts}`);
      console.log(`   Connected: ${data.connected ? 'Yes' : 'No'}`);
      console.log(`   IMAP accounts: ${data.accounts.imap}`);
      
      if (data.emailAccounts && data.emailAccounts.length > 0) {
        console.log('\n📧 Email accounts:');
        data.emailAccounts.forEach((account, index) => {
          console.log(`   ${index + 1}. ${account.email} (${account.provider_type}) - ${account.is_active ? 'Active' : 'Inactive'}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Failed to check email status:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking email status:', error.message);
    return false;
  }
}

async function runWorkflowTest() {
  console.log('🚀 Starting CRM IMAP Workflow Test');
  console.log(`📧 Testing with: ${TEST_CONFIG.email}`);
  console.log(`🏠 IMAP Host: ${TEST_CONFIG.imapHost}:${TEST_CONFIG.imapPort}`);
  console.log(`🔐 Security: ${TEST_CONFIG.imapSecurity}`);
  
  let success = true;
  
  // Step 1: Test connection
  console.log('\n' + '='.repeat(50));
  console.log('Step 1: Testing IMAP Connection');
  console.log('='.repeat(50));
  const connectionOk = await testConnection();
  if (!connectionOk) {
    success = false;
  }
  
  // Step 2: Add IMAP account
  console.log('\n' + '='.repeat(50));
  console.log('Step 2: Adding IMAP Account');
  console.log('='.repeat(50));
  if (connectionOk) {
    createdAccountId = await addImapAccount();
    if (!createdAccountId) {
      success = false;
    }
  }
  
  // Step 3: Check email accounts status
  console.log('\n' + '='.repeat(50));
  console.log('Step 3: Checking Email Accounts Status');
  console.log('='.repeat(50));
  if (createdAccountId) {
    const statusOk = await checkEmailAccounts();
    if (!statusOk) {
      success = false;
    }
  }
  
  // Step 4: Fetch emails
  console.log('\n' + '='.repeat(50));
  console.log('Step 4: Fetching Emails');
  console.log('='.repeat(50));
  if (createdAccountId) {
    const fetchOk = await fetchEmails(createdAccountId);
    if (!fetchOk) {
      success = false;
    }
  }
  
  // Final results
  console.log('\n' + '='.repeat(50));
  console.log('🏁 WORKFLOW TEST RESULTS');
  console.log('='.repeat(50));
  
  if (success && createdAccountId) {
    console.log('🎉 SUCCESS! Complete IMAP workflow working perfectly!');
    console.log('\n✅ All steps completed:');
    console.log('   • IMAP connection test: PASSED');
    console.log('   • Account creation: PASSED');
    console.log('   • Email status check: PASSED');
    console.log('   • Email fetching: PASSED');
    console.log('\n🎯 The email account is ready to use in the CRM dashboard!');
    console.log(`   Account ID: ${createdAccountId}`);
  } else {
    console.log('❌ WORKFLOW FAILED! Some steps did not complete successfully.');
    console.log('\nTroubleshooting:');
    console.log('1. Ensure the CRM server is running on localhost:3000');
    console.log('2. Make sure you are logged in to the CRM');
    console.log('3. Check the server logs for detailed error messages');
    console.log('4. Verify the email credentials are correct');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Go to Email Management in the CRM dashboard');
  console.log('2. Select the added IMAP account from the dropdown');
  console.log('3. View and manage emails through the web interface');
}

// Run the workflow test
if (require.main === module) {
  runWorkflowTest().catch(error => {
    console.error('❌ Workflow test failed:', error);
    process.exit(1);
  });
}

module.exports = { runWorkflowTest }; 