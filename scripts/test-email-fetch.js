// Simple script to test email fetching functionality
require('dotenv').config({ path: '.env.local' });
const { ImapFlow } = require('imapflow');

async function testEmailConnection() {
  console.log('Testing email connection...');
  
  // Check if environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('ERROR: EMAIL_USER and EMAIL_PASS environment variables must be set');
    console.log('Current config:');
    console.log('- EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
    console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Not set');
    console.log('- IMAP_HOST:', process.env.IMAP_HOST || 'imap.gmail.com (default)');
    console.log('- IMAP_PORT:', process.env.IMAP_PORT || '993 (default)');
    return;
  }

  // Create IMAP client
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: process.env.IMAP_PORT ? parseInt(process.env.IMAP_PORT, 10) : 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: false,
  });

  try {
    // Connect to the server
    console.log('Connecting to IMAP server...');
    await client.connect();
    console.log('✓ Connected successfully!');

    // Select and lock the inbox
    console.log('Opening inbox...');
    const lock = await client.getMailboxLock('INBOX');
    console.log('✓ Inbox opened successfully!');

    // Search for unread messages
    console.log('Searching for unread messages...');
    const messages = await client.search({ seen: false });
    console.log(`✓ Found ${messages.length} unread messages`);

    // Fetch details of the first 3 unread messages
    const maxMessages = Math.min(3, messages.length);
    if (maxMessages > 0) {
      console.log(`Fetching details for ${maxMessages} messages:`);
      
      for (let i = 0; i < maxMessages; i++) {
        const message = messages[i];
        const parsed = await client.fetchOne(message.toString(), { 
          envelope: true,
          bodyParts: ['text/plain', 'text/html']
        });
        
        const sender = parsed.envelope.from?.[0] || { address: 'unknown', name: 'Unknown' };
        console.log(`\nMessage #${i+1}:`);
        console.log(`- From: ${sender.name} <${sender.address}>`);
        console.log(`- Subject: ${parsed.envelope.subject || '(No subject)'}`);
        console.log(`- Date: ${parsed.envelope.date || 'Unknown'}`);
      }
    }

    // Release the lock
    lock.release();
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('ERROR connecting to email server:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close the connection
    try {
      await client.logout();
      console.log('Connection closed.');
    } catch (e) {
      console.error('Error closing connection:', e.message);
    }
  }
}

// Run the test
testEmailConnection().catch(console.error);
