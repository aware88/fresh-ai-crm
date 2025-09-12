import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    // Check for internal call (from automatic sync)
    const userAgent = request.headers.get('User-Agent') || '';
    const isInternalCall = userAgent.includes('Internal-IMAP-Setup') || 
                          userAgent.includes('Manual-Sync-Script') ||
                          userAgent.includes('Internal-RealTime-Sync') ||
                          userAgent.includes('BackgroundSyncService') ||
                          userAgent.includes('CronRunner');
    
    console.log(`🔍 Sync API called - User-Agent: "${userAgent}", Internal: ${isInternalCall}`);
    
    let userId = null;
    
    if (!isInternalCall) {
      // Regular authentication for browser calls
      console.log('🔐 Checking session authentication...');
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user?.id) {
        console.log('❌ No valid session found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      console.log(`✅ Authenticated user: ${userId}`);
    } else {
      console.log('🔧 Internal call - bypassing authentication');
    }

    const { accountId, maxEmails = 100 } = await request.json(); // Start with 100 for testing (50+50)
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get the email account details
    let accountQuery = supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('provider_type', 'imap')
      .eq('is_active', true);
    
    // Add user_id filter only for authenticated calls
    if (userId) {
      accountQuery = accountQuery.eq('user_id', userId);
    }
    
    const { data: account, error: accountError } = await accountQuery.single();

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
      
      // Sync INBOX emails (50 for testing, then 5000 for production)
      const inboxBatchSize = Math.floor(maxEmails / 2);
      console.log(`📥 Starting INBOX sync (${inboxBatchSize} emails)...`);
      const inboxEmails = await fetchEmailsFromFolder(client, 'INBOX', inboxBatchSize);
      console.log(`📧 Fetched ${inboxEmails.length} emails from INBOX`);
      
      // CRITICAL: Ensure user_id is ALWAYS set
      const effectiveUserId = userId || account.user_id;
      if (!effectiveUserId) {
        throw new Error('User ID is required for email sync');
      }
      const savedInbox = await saveEmailsToDatabase(supabase, effectiveUserId, inboxEmails, 'received', accountId);
      console.log(`💾 Saved ${savedInbox} INBOX emails to database`);
      totalSaved += savedInbox;
      
      // Sync Sent emails (50 for testing, then 5000 for production)
      const sentBatchSize = Math.floor(maxEmails / 2);
      console.log(`📤 Starting Sent sync (${sentBatchSize} emails)...`);
      const sentEmails = await fetchEmailsFromFolder(client, 'INBOX.Sent', sentBatchSize);
      console.log(`📧 Fetched ${sentEmails.length} emails from INBOX.Sent`);
      
      const savedSent = await saveEmailsToDatabase(supabase, effectiveUserId, sentEmails, 'sent', accountId);
      console.log(`💾 Saved ${savedSent} Sent emails to database`);
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
      
      // Trigger background AI processing for new emails (existing implementation)
      // effectiveUserId already declared above
      if (effectiveUserId && totalSaved > 0) {
        try {
          console.log('🤖 Triggering background AI processing for synced emails...');
          const OpenAI = (await import('openai')).default;
          const { getBackgroundProcessor } = await import('@/lib/email/background-ai-processor');
          
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });
          
          if (openai.apiKey) {
            const processor = getBackgroundProcessor(supabase, openai);
            
            // Get organization ID
            const { data: preferences } = await supabase
              .from('user_preferences')
              .select('current_organization_id')
              .eq('user_id', effectiveUserId)
              .single();
            
            // Get last 50 emails to process
            const { data: recentEmails } = await supabase
              .from('email_index')
              .select('message_id')
              .eq('user_id', effectiveUserId)
              .eq('folder', 'INBOX')
              .order('sent_at', { ascending: false })
              .limit(50);
            
            if (recentEmails && recentEmails.length > 0) {
              // Process emails in background (don't wait)
              const contexts = recentEmails.map(email => ({
                emailId: email.message_id,
                userId: effectiveUserId,
                organizationId: preferences?.current_organization_id,
                priority: 'low' as const,
                skipDraft: false,
                forceReprocess: false
              }));
              
              processor.processBatch(contexts).then(results => {
                const successful = results.filter(r => r.success).length;
                console.log(`✅ Background processing complete: ${successful}/${results.length} emails processed`);
              }).catch(error => {
                console.error('❌ Background processing failed:', error);
              });
            }
          }
        } catch (error) {
          console.error('⚠️ Could not start background processing:', error);
          // Don't fail the sync if background processing fails
        }
      }
      
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
    console.log(`📬 ${folderName}: ${mailbox.exists} messages available`);
    
    if (mailbox.exists === 0) {
      console.log(`📭 ${folderName}: No emails to sync`);
      return [];
    }
    
    // Smart limit: sync what's available, up to maxEmails
    const fetchCount = Math.min(maxEmails, mailbox.exists);
    const start = Math.max(1, mailbox.exists - fetchCount + 1);
    const end = mailbox.exists;
    
    console.log(`📥 ${folderName}: Syncing ${fetchCount} most recent emails (${start}-${end})`);
    
    console.log(`   📥 Fetching messages ${start}:${end}`);
    
    const emails = [];
    
    for (let seqno = end; seqno >= start && emails.length < maxEmails; seqno--) {
      try {
        // Progress logging every 100 emails
        if ((end - seqno + 1) % 100 === 0) {
          console.log(`   📧 Processing email ${end - seqno + 1}/${fetchCount} (seqno: ${seqno})`);
        }
        
        const message = await client.fetchOne(seqno, { source: true, flags: true });
        
        if (message.source) {
          const parsed = await simpleParser(message.source);
          emails.push({
            parsed,
            seqno,
            uid: message.uid,
            flags: message.flags
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
    const emailIndexRecords = [];
    const contentCacheRecords = [];
    
    for (const email of batch) {
      if (!email.parsed) continue;
      
      const parsed = email.parsed;
      let messageId = parsed.messageId || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate and clean message ID
      if (messageId && typeof messageId === 'string') {
        // Remove angle brackets if present
        messageId = messageId.replace(/^<|>$/g, '');
        
        // If it still looks like an email address or is suspiciously long, generate a new one
        if (messageId.includes('@') || messageId.length > 200) {
          console.warn('Replacing malformed message ID:', messageId);
          messageId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      }
      
      // Check for duplicates in email_index
      const { data: existing } = await supabase
        .from('email_index')
        .select('id')
        .eq('message_id', messageId)
        .eq('email_account_id', accountId)
        .single();
        
      if (existing) continue;
      
      // Create email_index record without thread_id to avoid constraint issues
      const emailIndexRecord = {
        message_id: messageId,
        email_account_id: accountId,
        subject: parsed.subject || 'No Subject',
        sender_email: parsed.from?.value?.[0]?.address || parsed.from?.text || 'unknown',
        sender_name: parsed.from?.value?.[0]?.name || null,
        recipient_email: parsed.to?.value?.[0]?.address || parsed.to?.text || null,
        email_type: emailType, // 'sent' or 'received'
        folder_name: emailType === 'sent' ? 'Sent' : 'INBOX', // Set proper folder name
        thread_id: messageId, // Use message_id as thread_id for simplicity
        sent_at: emailType === 'sent' ? (parsed.date ? parsed.date.toISOString() : new Date().toISOString()) : null,
        received_at: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
        has_attachments: (parsed.attachments && parsed.attachments.length > 0) || false,
        is_read: email.flags ? email.flags.has('\\Seen') : false, // Set read status from IMAP flags
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create email_content_cache record (minimal columns)
      const contentCacheRecord = {
        message_id: messageId,
        plain_content: parsed.text || null,
        html_content: parsed.html || null
        // Remove created_at/updated_at if they don't exist in schema
      };
      
      emailIndexRecords.push(emailIndexRecord);
      contentCacheRecords.push(contentCacheRecord);
    }
    
    if (emailIndexRecords.length > 0) {
      // First, create thread entries for each unique thread_id
      const uniqueThreadIds = [...new Set(emailIndexRecords.map(record => record.message_id))];
      
      for (const threadId of uniqueThreadIds) {
        try {
          // Try to create thread entry (ignore if already exists)
          await supabase
            .from('email_threads')
            .upsert({ 
              id: threadId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              ignoreDuplicates: true
            });
        } catch (threadError) {
          // Ignore thread creation errors (might already exist)
          console.log(`Thread ${threadId} might already exist, continuing...`);
        }
      }
      
      // Now add thread_id to email records
      const emailIndexRecordsWithThreads = emailIndexRecords.map(record => ({
        ...record,
        thread_id: record.message_id // Use message_id as thread_id for now
      }));
      
      // Use the new insert_email_direct RPC function
      console.log(`📤 Using insert_email_direct RPC to insert ${emailIndexRecordsWithThreads.length} emails...`);
      
      // Add necessary fields with defaults
      const recordsForRPC = emailIndexRecordsWithThreads.map(record => ({
        id: crypto.randomUUID(),
        ...record,
        user_id: userId,
        organization_id: null,
        imap_uid: record.imap_uid || null,
        sender_name: record.sender_name || null,
        recipient_email: record.recipient_email || null,
        preview_text: record.subject ? record.subject.substring(0, 200) : null,
        importance: 'normal',
        attachment_count: record.has_attachments ? 1 : 0,
        ai_analyzed: false,
        ai_analyzed_at: null,
        sentiment_score: null,
        language_code: null,
        upsell_data: null,
        assigned_agent: null,
        highlight_color: null,
        agent_priority: null,
        replied: false,
        last_reply_at: null,
        processing_status: 'pending'
      }));
      
      const { data: insertResult, error: rpcError } = await supabase
        .rpc('insert_email_direct', {
          p_records: recordsForRPC
        });
        
      if (rpcError) {
        console.error(`❌ insert_email_direct RPC failed:`, rpcError.message);
        console.error('Full error:', rpcError);
      } else if (insertResult) {
        console.log(`✅ insert_email_direct result:`, insertResult);
      }
      
      // Insert into email_content_cache
      const { error: contentError } = await supabase
        .from('email_content_cache')
        .insert(contentCacheRecords);
        
      if (contentError) {
        console.error(`❌ Error inserting content_cache batch:`, contentError.message);
        continue;
      }
      
      savedCount += emailIndexRecords.length;
      console.log(`   ✅ Saved batch ${Math.floor(i/batchSize) + 1}: ${emailIndexRecords.length} emails`);
    }
  }
  
  return savedCount;
}
