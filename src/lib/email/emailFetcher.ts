import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as crypto from 'crypto';
import { getBackgroundProcessor } from './background-ai-processor';
import OpenAI from 'openai';

// Database setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Decrypt password with AES-256-GCM
function decryptPassword(encryptedValue: string): string {
  const key = process.env.PASSWORD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
  }
  
  // Use the first 32 bytes of the key for AES-256
  const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
  
  // Split the encrypted value into IV, AuthTag and encrypted content
  const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted value format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Interface for our IMAP account
interface ImapAccount {
  id: string;
  user_id: string;
  email: string;
  provider_type: string;
  imap_host: string;
  imap_port: number;
  imap_security: string;
  username: string;
  password_encrypted: string;
  is_active: boolean;
  last_sync?: string;
}

// Interface for parsed email
interface ParsedEmail {
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  messageId: string;
  attachments: Array<{
    filename?: string;
    contentType?: string;
    content: Buffer;
    size?: number;
  }>;
  headers: Record<string, any>;
}

/**
 * Fetches emails from an IMAP account
 * 
 * @param account The IMAP account configuration
 * @param maxEmails Maximum number of emails to fetch (default: 50)
 * @param markAsSeen Whether to mark emails as seen (default: false)
 * @returns Array of fetched emails
 */
async function fetchEmailsFromAccount(
  account: ImapAccount,
  maxEmails: number = 50,
  markAsSeen: boolean = false
): Promise<ParsedEmail[]> {
  // Decrypt the password
  const password = decryptPassword(account.password_encrypted);
  
  // Configure security options based on the selected security type
  const secure = account.imap_security !== 'None';
  
  // Create IMAP client with appropriate options
  const clientOptions: any = {
    host: account.imap_host,
    port: account.imap_port || 993,
    secure,
    auth: {
      user: account.username || account.email,
      pass: password,
    },
    logger: false as const,
    connectTimeout: 60 * 1000, // 60 second timeout
  };
  
  // Add requireTLS option if using STARTTLS
  if (account.imap_security === 'STARTTLS') {
    clientOptions.requireTLS = true;
  }
  
  const client = new ImapFlow(clientOptions);
  
  const emails: ParsedEmail[] = [];
  
  try {
    // Connect to the server
    await client.connect();
    
    // Get the last sync date or default to 30 days ago
    const lastSync = account.last_sync 
      ? new Date(account.last_sync) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Open the inbox
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`Connected to ${account.email} inbox with ${mailbox.exists} messages`);
    
    // Search for emails newer than the last sync
    const searchFilter = {
      since: lastSync,
      seen: false // Only fetch unseen emails
    };
    
    // Process messages
    let count = 0;
    for await (const message of client.fetch(searchFilter, { source: true, envelope: true })) {
      if (count >= maxEmails) break;
      
      // Get the raw source
      const source = message.source?.toString();
      
      if (!source) {
        console.warn('Message source is undefined, skipping message');
        continue;
      }
      
      // Parse the email
      const parsed = await simpleParser(source);
      
      const parsedEmail: ParsedEmail = {
        messageId: parsed.messageId || `no-id-${Date.now()}-${Math.random()}`,
        from: typeof parsed.from === 'object' ? 
          (Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '') : '',
        fromEmail: parsed.from?.value?.[0]?.address || '',
        to: typeof parsed.to === 'object' ? 
          (Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '') : '',
        subject: parsed.subject || '(No Subject)',
        text: parsed.text || '',
        html: parsed.html || '',
        date: parsed.date || new Date(),
        attachments: parsed.attachments || [],
        headers: parsed.headers.get,
      };
      
      emails.push(parsedEmail);
      
      // Mark as seen if requested
      if (markAsSeen && message.uid) {
        // Use a search object compatible with ImapFlow
        const searchCriteria = { uid: message.uid.toString() };
        await client.messageFlagsAdd(searchCriteria, ['\\Seen']);
      }
      
      count++;
    }
    
    // Update the last sync time
    await supabase
      .from('email_accounts')
      .update({
        last_sync: new Date().toISOString(),
        last_sync_successful: true,
        last_sync_count: emails.length,
      })
      .eq('id', account.id);
      
    console.log(`Fetched ${emails.length} emails from ${account.email}`);
    
  } catch (error) {
    console.error(`Error fetching emails from ${account.email}:`, error);
    
    // Update sync status with error
    await supabase
      .from('email_accounts')
      .update({
        last_sync: new Date().toISOString(),
        last_sync_successful: false,
        last_sync_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', account.id);
      
    throw error;
  } finally {
    // Always close the connection
    try {
      // Only attempt logout if client exists and is authenticated
      if (client && client.authenticated) {
        try {
          await client.logout();
        } catch (error) {
          // Ignore specific NoConnection errors
          const logoutError = error as any;
          if (!logoutError.code || logoutError.code !== 'NoConnection') {
            throw error; // Re-throw if it's a different error
          }
          // Otherwise, silently ignore NoConnection errors
          console.log(`Ignoring expected NoConnection error during logout for ${account.email}`);
        }
      }
    } catch (error) {
      console.error(`Error closing connection for ${account.email}:`, error);
      // Non-critical error, continue execution
    }
  }
  
  return emails;
}

/**
 * Saves fetched emails to the database
 * 
 * @param accountId The IMAP account ID
 * @param userId The user ID
 * @param emails Array of emails to save
 * @returns Number of emails saved
 */
async function saveEmailsToDB(
  accountId: string, 
  userId: string,
  emails: ParsedEmail[]
): Promise<number> {
  if (!emails.length) return 0;
  
  const emailsToInsert = emails.map(email => ({
    user_id: userId,
    email_account_id: accountId,
    message_id: email.messageId,
    from_address: email.fromEmail,
    from_name: email.from.replace(`<${email.fromEmail}>`, '').trim(),
    to_address: email.to,
    subject: email.subject,
    text_content: email.text,
    html_content: email.html,
    received_date: email.date,
    has_attachments: email.attachments.length > 0,
    headers: email.headers,
    // Process state for AI processing pipeline
    is_processed: false,
    is_archived: false,
  }));
  
  // Insert emails in batches to avoid hitting size limits
  const batchSize = 20;
  let savedCount = 0;
  
  for (let i = 0; i < emailsToInsert.length; i += batchSize) {
    const batch = emailsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('emails')
      .upsert(batch, { 
        onConflict: 'message_id',
        ignoreDuplicates: true 
      });
      
    if (error) {
      console.error('Error saving emails to database:', error);
      // Continue with next batch even if this one failed
    } else {
      savedCount += (data?.length || 0);
    }
  }
  
  return savedCount;
}

/**
 * Process attachments for emails
 * 
 * @param emails Array of emails with attachments
 * @param userId User ID
 * @param accountId Email account ID
 */
async function processAttachments(
  emails: ParsedEmail[],
  userId: string,
  accountId: string
): Promise<void> {
  for (const email of emails) {
    if (!email.attachments || email.attachments.length === 0) continue;
    
    for (const attachment of email.attachments) {
      const fileData = attachment.content;
      const fileName = attachment.filename || 'attachment.bin';
      const contentType = attachment.contentType || 'application/octet-stream';
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('email-attachments')
        .upload(
          `${userId}/${accountId}/${email.messageId}/${fileName}`, 
          fileData, 
          { contentType }
        );
        
      if (error) {
        console.error(`Error uploading attachment ${fileName}:`, error);
        continue;
      }
      
      // Insert attachment record
      const { error: insertError } = await supabase
        .from('email_attachments')
        .insert({
          email_message_id: email.messageId,
          filename: fileName,
          content_type: contentType,
          size_bytes: fileData.length,
          storage_path: data?.path,
        });
        
      if (insertError) {
        console.error(`Error saving attachment metadata for ${fileName}:`, insertError);
      }
    }
  }
}

/**
 * Process emails with AI in the background
 */
async function processEmailsWithAI(
  emails: ParsedEmail[],
  userId: string,
  organizationId?: string
): Promise<void> {
  if (!emails.length) return;
  
  console.log(`[EmailFetcher] Starting AI processing for ${emails.length} emails`);
  
  try {
    // Initialize AI processor
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!openai.apiKey) {
      console.log('[EmailFetcher] OpenAI API key not available, skipping AI processing');
      return;
    }

    const processor = getBackgroundProcessor(supabase, openai);
    
    // Create processing contexts for all emails
    const contexts = emails.map(email => ({
      emailId: email.id,
      userId,
      organizationId,
      priority: 'normal' as const,
      skipDraft: false // Generate drafts for all emails
    }));

    // Process in batch (with concurrency control)
    const results = await processor.processEmailsBatch(contexts);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`[EmailFetcher] AI processing completed: ${successful} successful, ${failed} failed`);
    
  } catch (error) {
    console.error('[EmailFetcher] Error in AI processing:', error);
  }
}

/**
 * Main function to fetch emails from all active accounts
 */
export async function fetchAllEmails(): Promise<{ 
  success: boolean; 
  accountsFetched: number;
  emailsFetched: number;
  errors: string[] 
}> {
  console.log('Starting email fetch for all active accounts');
  const errors: string[] = [];
  let totalEmailsFetched = 0;
  let accountsFetched = 0;
  
  try {
    // Get all active email accounts
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching email accounts:', error);
      throw new Error(`Failed to fetch email accounts: ${error.message}`);
    }
    
    console.log(`Found ${accounts?.length || 0} active email accounts`);
    
    if (!accounts || accounts.length === 0) {
      return { 
        success: true, 
        accountsFetched: 0,
        emailsFetched: 0,
        errors: [] 
      };
    }
    
    // Process each account
    for (const account of accounts) {
      try {
        console.log(`Fetching emails for ${account.email}`);
        
        // Fetch emails
        const emails = await fetchEmailsFromAccount(account);
        
        // Save to database
        const savedCount = await saveEmailsToDB(account.id, account.user_id, emails);
        
        // Process attachments in the background
        processAttachments(emails, account.user_id, account.id)
          .catch(error => console.error(`Error processing attachments for ${account.email}:`, error));
          
        // Process emails with AI in the background
        processEmailsWithAI(emails, account.user_id, account.organization_id)
          .catch(error => console.error(`Error processing emails with AI for ${account.email}:`, error));
        
        totalEmailsFetched += savedCount;
        accountsFetched++;
        
        console.log(`Successfully processed ${savedCount} emails for ${account.email}`);
      } catch (error) {
        const errorMessage = `Error processing account ${account.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
    
    console.log(`Email fetch complete. Processed ${accountsFetched} accounts, fetched ${totalEmailsFetched} emails`);
    
    return {
      success: true,
      accountsFetched,
      emailsFetched: totalEmailsFetched,
      errors
    };
    
  } catch (error) {
    const errorMessage = `Error in fetchAllEmails: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage);
    return {
      success: false,
      accountsFetched,
      emailsFetched: totalEmailsFetched,
      errors: [errorMessage, ...errors]
    };
  }
}
