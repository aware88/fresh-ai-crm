const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

// Test credentials
const TEST_EMAIL = 'tim.mak@bulknutrition.eu';
const TEST_PASSWORD = 'BulkBulk123!';

// Common IMAP settings to try
const IMAP_CONFIGS = [
  {
    name: 'Standard SSL/TLS (993)',
    port: 993,
    secure: true,
    auth: {
      user: TEST_EMAIL,
      pass: TEST_PASSWORD,
    },
    logger: false,
    connectTimeout: 30000,
  },
  {
    name: 'Standard SSL/TLS (993) - Skip Cert Verification',
    port: 993,
    secure: true,
    auth: {
      user: TEST_EMAIL,
      pass: TEST_PASSWORD,
    },
    logger: false,
    connectTimeout: 30000,
    tls: {
      rejectUnauthorized: false
    }
  },
  {
    name: 'STARTTLS (143)',
    port: 143,
    secure: false,
    requireTLS: true,
    auth: {
      user: TEST_EMAIL,
      pass: TEST_PASSWORD,
    },
    logger: false,
    connectTimeout: 30000,
  },
  {
    name: 'STARTTLS (143) - Skip Cert Verification',
    port: 143,
    secure: false,
    requireTLS: true,
    auth: {
      user: TEST_EMAIL,
      pass: TEST_PASSWORD,
    },
    logger: false,
    connectTimeout: 30000,
    tls: {
      rejectUnauthorized: false
    }
  },
  {
    name: 'Alternative SSL (465)',
    port: 465,
    secure: true,
    auth: {
      user: TEST_EMAIL,
      pass: TEST_PASSWORD,
    },
    logger: false,
    connectTimeout: 30000,
  },
  {
    name: 'Alternative SSL (465) - Skip Cert Verification',
    port: 465,
    secure: true,
    auth: {
      user: TEST_EMAIL,
      pass: TEST_PASSWORD,
    },
    logger: false,
    connectTimeout: 30000,
    tls: {
      rejectUnauthorized: false
    }
  }
];

// Determine IMAP host based on email domain
function getImapHost(email) {
  const domain = email.split('@')[1].toLowerCase();
  
  // Common domain mappings
  const domainMappings = {
    'gmail.com': 'imap.gmail.com',
    'googlemail.com': 'imap.gmail.com',
    'outlook.com': 'imap-mail.outlook.com',
    'hotmail.com': 'imap-mail.outlook.com',
    'live.com': 'imap-mail.outlook.com',
    'yahoo.com': 'imap.mail.yahoo.com',
    'yahoo.co.uk': 'imap.mail.yahoo.com',
    'aol.com': 'imap.aol.com',
    'icloud.com': 'imap.mail.me.com',
    'me.com': 'imap.mail.me.com',
  };
  
  if (domainMappings[domain]) {
    return domainMappings[domain];
  }
  
  // For bulknutrition.eu, try common patterns AND the discovered zabec.net servers
  if (domain === 'bulknutrition.eu') {
    return [
      'mail.bulknutrition.eu',  // Original
      'mail.zabec.net',         // Discovered from certificate
      'imap.zabec.net',         // Common pattern
      'zabec.net',              // Base domain
      `imap.${domain}`,
      `mail.${domain}`,
      `${domain}`,
    ];
  }
  
  // For other domains, try common patterns
  return [
    `imap.${domain}`,
    `mail.${domain}`,
    `${domain}`,
    `imap.mail.${domain}`
  ];
}

async function testImapConnection(config) {
  console.log(`\n🧪 Testing ${config.name}...`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   RequireTLS: ${config.requireTLS || 'false'}`);
  console.log(`   Skip Cert Check: ${config.tls?.rejectUnauthorized === false ? 'true' : 'false'}`);
  
  const client = new ImapFlow(config);
  
  try {
    console.log(`   Connecting...`);
    await client.connect();
    console.log(`   ✅ Connected successfully!`);
    
    // Try to open inbox
    console.log(`   Opening INBOX...`);
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`   ✅ INBOX opened - ${mailbox.exists} messages total`);
    
    if (mailbox.exists > 0) {
      console.log(`   Fetching most recent email...`);
      
      // Fetch the most recent email
      const message = await client.fetchOne(mailbox.exists.toString(), {
        source: true,
        envelope: true,
        flags: true
      });
      
      if (message && message.source) {
        const parsed = await simpleParser(message.source.toString());
        
        console.log(`   ✅ Email fetched successfully:`);
        console.log(`      From: ${parsed.from?.text || 'Unknown'}`);
        console.log(`      Subject: ${parsed.subject || '(No Subject)'}`);
        console.log(`      Date: ${parsed.date || 'Unknown'}`);
        console.log(`      Read: ${message.flags?.has('\\Seen') || false}`);
        
        // Show a preview of the content
        const preview = parsed.text ? parsed.text.substring(0, 100).replace(/\n/g, ' ') : '';
        if (preview) {
          console.log(`      Preview: ${preview}...`);
        }
      }
    } else {
      console.log(`   📭 No emails in inbox`);
    }
    
    await client.logout();
    console.log(`   ✅ Disconnected cleanly`);
    
    return {
      success: true,
      config: config.name,
      messageCount: mailbox.exists,
      host: config.host
    };
    
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    
    try {
      await client.logout();
    } catch (logoutError) {
      // Ignore logout errors
    }
    
    return {
      success: false,
      config: config.name,
      error: error.message,
      host: config.host
    };
  }
}

async function runImapTests() {
  console.log('🚀 Starting IMAP Connection Tests');
  console.log(`📧 Testing email: ${TEST_EMAIL}`);
  console.log(`🔐 Using provided password`);
  
  const imapHosts = getImapHost(TEST_EMAIL);
  const hosts = Array.isArray(imapHosts) ? imapHosts : [imapHosts];
  
  console.log(`\n🌐 Detected possible IMAP hosts: ${hosts.join(', ')}`);
  
  const results = [];
  let foundWorking = false;
  
  // Test each host with each configuration
  for (const host of hosts) {
    if (foundWorking) break; // Stop if we found a working configuration
    
    console.log(`\n🏠 Testing host: ${host}`);
    
    for (const config of IMAP_CONFIGS) {
      const testConfig = { ...config, host };
      const result = await testImapConnection(testConfig);
      results.push({ ...result, host });
      
      // If we found a working configuration, we can stop
      if (result.success) {
        console.log(`\n🎉 SUCCESS! Found working configuration:`);
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${testConfig.port}`);
        console.log(`   Security: ${testConfig.secure ? 'SSL/TLS' : (testConfig.requireTLS ? 'STARTTLS' : 'None')}`);
        console.log(`   Skip Cert Check: ${testConfig.tls?.rejectUnauthorized === false ? 'Yes' : 'No'}`);
        console.log(`   Messages: ${result.messageCount}`);
        foundWorking = true;
        break;
      }
    }
  }
  
  console.log(`\n📊 Test Results Summary:`);
  console.log(`=========================`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`\n✅ Successful Connections (${successful.length}):`);
    successful.forEach(result => {
      console.log(`   • ${result.host} - ${result.config} (${result.messageCount} messages)`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Connections (${failed.length}):`);
    failed.forEach(result => {
      console.log(`   • ${result.host} - ${result.config}: ${result.error}`);
    });
  }
  
  if (successful.length === 0) {
    console.log(`\n🚨 No working IMAP configurations found!`);
    console.log(`\nTroubleshooting suggestions:`);
    console.log(`1. Verify the email and password are correct`);
    console.log(`2. Check if the email provider requires app-specific passwords`);
    console.log(`3. Verify IMAP is enabled in the email account settings`);
    console.log(`4. Check firewall/network restrictions`);
    console.log(`5. The domain appears to be hosted on zabec.net servers`);
    console.log(`6. Contact email provider for correct IMAP settings`);
  } else {
    console.log(`\n🎯 Recommended settings for CRM:`);
    const best = successful[0];
    const config = IMAP_CONFIGS.find(c => c.name === best.config);
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   IMAP Host: ${best.host}`);
    console.log(`   IMAP Port: ${config.port}`);
    console.log(`   IMAP Security: ${config.secure ? 'SSL/TLS' : (config.requireTLS ? 'STARTTLS' : 'None')}`);
    console.log(`   Username: ${TEST_EMAIL}`);
    console.log(`   Password: [PROVIDED]`);
    console.log(`   Skip TLS Verification: ${config.tls?.rejectUnauthorized === false ? 'Yes (for testing only)' : 'No'}`);
    
    if (config.tls?.rejectUnauthorized === false) {
      console.log(`\n⚠️  WARNING: This configuration skips SSL certificate verification!`);
      console.log(`   This should only be used for testing. For production, contact your`);
      console.log(`   email provider to get the correct SSL certificate setup.`);
    }
  }
}

// Run the tests
if (require.main === module) {
  runImapTests().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { runImapTests, testImapConnection }; 