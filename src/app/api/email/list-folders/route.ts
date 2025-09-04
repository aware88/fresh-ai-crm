import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { ImapFlow } from 'imapflow';
import * as crypto from 'crypto';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Get the email account
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'tim.mak@bulknutrition.eu')
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
    }

    // Decrypt password
    const password = decryptPassword(account.password_encrypted);

    // Configure IMAP client
    const clientOptions = {
      host: account.imap_host,
      port: account.imap_port || 993,
      secure: account.imap_security === 'SSL/TLS',
      auth: {
        user: account.username || account.email,
        pass: password,
      },
      logger: false,
      connectTimeout: 30000,
      tls: {
        rejectUnauthorized: false
      }
    };

    const client = new ImapFlow(clientOptions);

    try {
      console.log(`🔍 Connecting to IMAP to list folders...`);
      await client.connect();
      
      // List all folders
      const mailboxList = await client.list();
      const folders = [];
      
      for (const mailbox of mailboxList) {
        try {
          const info = await client.mailboxOpen(mailbox.path, { readOnly: true });
          folders.push({
            name: mailbox.name,
            path: mailbox.path,
            delimiter: mailbox.delimiter,
            flags: mailbox.flags,
            specialUse: mailbox.specialUse,
            exists: info.exists,
            subscribed: mailbox.subscribed
          });
          await client.mailboxClose();
        } catch (folderError) {
          console.log(`⚠️ Could not access folder ${mailbox.path}:`, folderError.message);
          folders.push({
            name: mailbox.name,
            path: mailbox.path,
            delimiter: mailbox.delimiter,
            flags: mailbox.flags,
            specialUse: mailbox.specialUse,
            exists: 'unknown',
            subscribed: mailbox.subscribed,
            error: folderError.message
          });
        }
      }
      
      await client.logout();
      
      console.log(`📂 Found ${folders.length} folders:`, folders.map(f => `${f.name} (${f.exists} emails)`));
      
      return NextResponse.json({
        success: true,
        folders: folders,
        account_email: account.email
      });
      
    } catch (error) {
      console.error('IMAP connection error:', error);
      return NextResponse.json({ 
        error: 'Failed to connect to IMAP server', 
        details: error.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('List folders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
