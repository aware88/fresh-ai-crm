import { ImapFlow } from 'imapflow';

type EmailEnvelope = {
  from?: { address?: string; name?: string }[];
  subject?: string;
  date?: Date;
};

type Email = {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  to: string[];
  html?: string;
  read?: boolean;
};

/**
 * Fetches emails from the inbox
 * Fetches the 5 most recent emails (both read and unread)
 */
export async function fetchUnreadEmails(): Promise<Email[]> {
  const emails: Email[] = [];
  const maxEmails = 5; // Number of most recent emails to fetch
  
  // Create a new IMAP client for each fetch operation
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
    logger: false, // Disable detailed logging for production
  });

  try {
    console.log('Connecting to IMAP server...');
    await client.connect();
    console.log('Connected to IMAP server');

    // Select the inbox
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`Mailbox has ${mailbox.exists} messages`);

    // If no messages in the mailbox, return empty array
    if (mailbox.exists === 0) {
      console.log('No messages in mailbox');
      return [];
    }
    
    // Calculate the range of messages to fetch (most recent first)
    const totalMessages = mailbox.exists;
    const start = Math.max(1, totalMessages - maxEmails + 1);
    const end = totalMessages;
    
    console.log(`Fetching messages ${start} to ${end} (most recent ${maxEmails} messages)`);
    
    // Process each message in the range
    for (let i = end; i >= start; i--) {
      try {
        // Fetch the full message with all parts
        const fetchedMessage = await client.fetchOne(i.toString(), {
          source: true,
          envelope: true,
          flags: true
        });
        
        if (!fetchedMessage) {
          console.log(`No data for message ${i}`);
          continue;
        }
        
        if (!fetchedMessage.envelope) {
          console.log(`No envelope data in message ${i}`);
          continue;
        }
        
        // Get message content
        let body = '';
        if (fetchedMessage.source) {
          const source = fetchedMessage.source.toString();
          const bodyStartIndex = source.indexOf('\r\n\r\n');
          if (bodyStartIndex > -1) {
            body = source.substring(bodyStartIndex + 4);
          }
        }
        
        // Extract sender information
        const sender = fetchedMessage.envelope.from?.[0] || { address: '', name: '' };
        
        // Create and add email object
        emails.push({
          id: i.toString(),
          from: sender.address || 'unknown@example.com',
          subject: fetchedMessage.envelope.subject || '(No Subject)',
          body: body || '(No content)',
          date: fetchedMessage.envelope.date || new Date(),
          to: [],
          html: body,
          read: fetchedMessage.flags?.has('\\Seen') || false
        });
        
        // Dev-phase: do NOT mark as seen on the server; only reflect locally
        const localOnly = process.env.EMAIL_LOCAL_READ_ONLY === 'true' || process.env.NEXT_PUBLIC_EMAIL_LOCAL_READ_ONLY === 'true';
        if (!localOnly) {
          if (!fetchedMessage.flags?.has('\\Seen')) {
            try {
              await client.messageFlagsAdd(i.toString(), ['\\Seen']);
              console.log(`Marked message ${i} as seen`);
            } catch (markError) {
              console.error(`Error marking message ${i} as seen:`, markError);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing message ${i}:`, error);
      }
    }
    
    return emails;
  } catch (error) {
    console.error('Error in IMAP operations:', error);
    return [];
  } finally {
    // Ensure connection is closed
    try {
      await client.logout();
      console.log('IMAP connection closed');
    } catch (error) {
      console.error('Error closing IMAP connection:', error);
    }
  }
}
