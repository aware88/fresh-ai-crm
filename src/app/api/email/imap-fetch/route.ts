import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as crypto from 'crypto';

// Decrypt password with AES-256-GCM
function decryptPassword(encryptedPassword: string): string {
  const key = process.env.PASSWORD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
  }
  
  const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
  const parts = encryptedPassword.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted password format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export async function GET(request: Request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const maxEmails = parseInt(searchParams.get('maxEmails') || '20');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // Get the IMAP account details
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .eq('provider_type', 'imap')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, error: 'IMAP account not found or access denied' },
        { status: 404 }
      );
    }

    // Decrypt the password
    let password;
    try {
      password = decryptPassword(account.password_encrypted);
    } catch (error) {
      console.error('Failed to decrypt password:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt stored credentials' },
        { status: 500 }
      );
    }

    // Configure IMAP client
    const secure = account.imap_security === 'SSL/TLS';
    const requireTLS = account.imap_security === 'STARTTLS';
    
    const clientOptions: any = {
      host: account.imap_host,
      port: account.imap_port || 993,
      secure,
      auth: {
        user: account.username || account.email,
        pass: password,
      },
      logger: false,
      connectTimeout: 30000, // 30 second timeout
      // Add TLS options to handle certificate issues
      tls: {
        rejectUnauthorized: false // Allow self-signed or mismatched certificates
      }
    };
    
    if (requireTLS) {
      clientOptions.requireTLS = true;
    }

    const client = new ImapFlow(clientOptions);
    const emails: any[] = [];

    try {
      console.log(`Connecting to IMAP server for ${account.email}...`);
      await client.connect();
      
      // Open the inbox
      const mailbox = await client.mailboxOpen('INBOX');
      console.log(`Connected to ${account.email} inbox with ${mailbox.exists} messages`);
      
      if (mailbox.exists === 0) {
        return NextResponse.json({
          success: true,
          emails: [],
          count: 0,
          account: account.email
        });
      }
      
      // Calculate the range of messages to fetch (most recent first)
      const totalMessages = mailbox.exists;
      const start = Math.max(1, totalMessages - maxEmails + 1);
      const end = totalMessages;
      
      console.log(`Fetching messages ${start} to ${end} from ${account.email}`);
      
      // Fetch messages in reverse order (newest first)
      for (let seqno = end; seqno >= start && emails.length < maxEmails; seqno--) {
        try {
          const message = await client.fetchOne(seqno.toString(), {
            source: true,
            envelope: true,
            flags: true
          });
          
          if (!message || !message.source) {
            continue;
          }
          
          // Parse the email
          const parsed = await simpleParser(message.source.toString());
          
          const email = {
            id: `${account.id}-${seqno}`,
            from: parsed.from?.text || 'Unknown Sender',
            subject: parsed.subject || '(No Subject)',
            body: parsed.text || parsed.html || '',
            date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
            read: message.flags?.has('\\Seen') || false,
            folder: 'inbox',
            attachments: parsed.attachments || []
          };
          
          emails.push(email);
        } catch (msgError) {
          console.error(`Error processing message ${seqno}:`, msgError);
        }
      }
      
      return NextResponse.json({
        success: true,
        emails,
        count: emails.length,
        account: account.email
      });
      
    } finally {
      try {
        await client.logout();
      } catch (error) {
        console.error('Error closing IMAP connection:', error);
      }
    }
  } catch (error: any) {
    console.error('Error in IMAP fetch API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
} 