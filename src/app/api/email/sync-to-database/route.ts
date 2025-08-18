import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { accountId, maxEmails = 5000 } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get the email account details
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
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt stored credentials' },
        { status: 500 }
      );
    }

    // Configure IMAP client
    const clientOptions: any = {
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
        rejectUnauthorized: false // Allow self-signed or mismatched certificates
      }
    };

    const client = new ImapFlow(clientOptions);
    let totalSaved = 0;

    try {
      console.log(`📧 Syncing emails for ${account.email}...`);
      await client.connect();
      
      // Sync INBOX emails (2500 max)
      const inboxEmails = await fetchEmailsFromFolder(client, 'INBOX', Math.floor(maxEmails / 2));
      const savedInbox = await saveEmailsToDatabase(supabase, session.user.id, inboxEmails, 'received', accountId);
      totalSaved += savedInbox;
      
      // Sync Sent emails (2500 max)
      const sentEmails = await fetchEmailsFromFolder(client, 'Sent', Math.floor(maxEmails / 2));
      const savedSent = await saveEmailsToDatabase(supabase, session.user.id, sentEmails, 'sent', accountId);
      totalSaved += savedSent;
      
      await client.logout();
      
      // Update sync metadata in email_accounts table
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (updateError) {
        console.error('Warning: Failed to update sync metadata:', updateError);
      }
      
      console.log(`✅ Email sync complete: ${totalSaved} emails saved`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${totalSaved} emails to database`,
        totalSaved,
        breakdown: {
          inbox: savedInbox,
          sent: savedSent
        },
        syncedAt: new Date().toISOString()
      });
      
    } catch (error) {
      await client.logout();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Email sync error:', error);
    
    let errorMessage = 'Failed to sync emails';
    if (error instanceof Error) {
      if (error.message.includes('CERT_ALTNAME_INVALID')) {
        errorMessage = 'SSL certificate issue with email server. Contact your email provider.';
      } else if (error.message.includes('Authentication failed')) {
        errorMessage = 'Email authentication failed. Check your credentials.';
      } else {
        errorMessage = error.message;
      }
    }

    // Save error to email_accounts table
    try {
      await supabase
        .from('email_accounts')
        .update({
          sync_error: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
    } catch (updateError) {
      console.error('Failed to save sync error:', updateError);
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function fetchEmailsFromFolder(client: ImapFlow, folderName: string, maxEmails: number) {
  try {
    const mailbox = await client.mailboxOpen(folderName);
    console.log(`📬 ${folderName}: ${mailbox.exists} messages`);
    
    if (mailbox.exists === 0) return [];
    
    const fetchCount = Math.min(maxEmails, mailbox.exists);
    const start = Math.max(1, mailbox.exists - fetchCount + 1);
    const end = mailbox.exists;
    
    console.log(`   📥 Fetching messages ${start}:${end}`);
    
    const emails = [];
    
    for (let seqno = end; seqno >= start && emails.length < maxEmails; seqno--) {
      try {
        const message = await client.fetchOne(seqno, { source: true });
        
        if (message.source) {
          const parsed = await simpleParser(message.source);
          emails.push({
            parsed,
            seqno,
            uid: message.uid
          });
        }
      } catch (error) {
        console.error(`⚠️ Error fetching message ${seqno}:`, error);
        continue;
      }
    }
    
    console.log(`   ✅ Fetched ${emails.length} emails from ${folderName}`);
    return emails;
    
  } catch (error) {
    console.error(`❌ Error in folder ${folderName}:`, error);
    return [];
  }
}

async function saveEmailsToDatabase(supabase: any, userId: string, emails: any[], emailType: string, accountId: string) {
  if (emails.length === 0) return 0;
  
  console.log(`💾 Saving ${emails.length} ${emailType} emails...`);
  
  let savedCount = 0;
  const batchSize = 10;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const emailsToInsert = [];
    
    for (const email of batch) {
      if (!email.parsed) continue;
      
      const parsed = email.parsed;
      const messageId = parsed.messageId || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Check for duplicates
      const { data: existing } = await supabase
        .from('emails')
        .select('id')
        .eq('message_id', messageId)
        .eq('created_by', userId)
        .single();
        
      if (existing) continue;
      
      const emailRecord = {
        // Let database auto-generate UUID
        created_by: userId,
        organization_id: null,
        message_id: messageId,
        subject: parsed.subject || 'No Subject',
        html_content: parsed.html || null,
        raw_content: parsed.text || parsed.html || '',
        email_type: emailType,
        has_attachments: (parsed.attachments && parsed.attachments.length > 0) || false,
        thread_id: parsed.references && Array.isArray(parsed.references) ? parsed.references[0] : null,
        created_at: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      emailsToInsert.push(emailRecord);
    }
    
    if (emailsToInsert.length > 0) {
      const { error } = await supabase
        .from('emails')
        .insert(emailsToInsert);
        
      if (error) {
        console.error(`❌ Error inserting batch:`, error.message);
      } else {
        savedCount += emailsToInsert.length;
        console.log(`   ✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${emailsToInsert.length} emails`);
      }
    }
  }
  
  return savedCount;
}
