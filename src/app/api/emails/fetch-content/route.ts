/**
 * API Endpoint: Fetch Email Content On-Demand
 * 
 * This endpoint fetches full email content from the email server (IMAP/Exchange/Gmail)
 * when needed, implementing the hybrid proxy architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

interface FetchContentRequest {
  messageId: string;
  imapUid?: number;
  folder?: string;
  accountId: string;
}

interface EmailContentResponse {
  messageId: string;
  subject?: string;
  html?: string;
  text?: string;
  raw?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;
  headers?: any;
  success: boolean;
  cached?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FetchContentRequest = await request.json();
    const { messageId, imapUid, folder = 'INBOX', accountId } = body;

    if (!messageId || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, accountId' },
        { status: 400 }
      );
    }

    console.log(`📧 Fetching content for message ${messageId}`);

    // 1. Check if content is already cached and valid
    const { data: cachedContent, error: cacheError } = await supabase
      .from('email_content_cache')
      .select('*')
      .eq('message_id', messageId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedContent && !cacheError) {
      console.log(`✅ Cache hit for ${messageId}`);
      
      // Update access stats
      await supabase
        .from('email_content_cache')
        .update({
          last_accessed: new Date().toISOString(),
          access_count: cachedContent.access_count + 1
        })
        .eq('message_id', messageId);

      return NextResponse.json({
        messageId,
        html: cachedContent.html_content,
        text: cachedContent.plain_content,
        raw: cachedContent.raw_content,
        attachments: cachedContent.attachments || [],
        success: true,
        cached: true
      } as EmailContentResponse);
    }

    // 2. Get email account details
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      console.error('Email account not found:', accountError);
      return NextResponse.json(
        { error: 'Email account not found or access denied' },
        { status: 403 }
      );
    }

    // 3. Fetch content based on provider type
    let emailContent: EmailContentResponse;

    if (account.provider_type === 'gmail') {
      emailContent = await fetchFromGmailAPI(messageId, account);
    } else if (account.provider_type === 'outlook') {
      emailContent = await fetchFromOutlookAPI(messageId, account);
    } else {
      emailContent = await fetchFromIMAP(messageId, imapUid, folder, account);
    }

    if (!emailContent.success) {
      return NextResponse.json(
        { error: 'Failed to fetch email content from server' },
        { status: 500 }
      );
    }

    // 4. Cache the fetched content
    try {
      await supabase.rpc('cache_email_content', {
        p_message_id: messageId,
        p_raw_content: emailContent.raw,
        p_html_content: emailContent.html,
        p_plain_content: emailContent.text,
        p_attachments: emailContent.attachments || []
      });

      console.log(`✅ Cached content for ${messageId}`);
    } catch (cacheError) {
      console.error('Failed to cache content:', cacheError);
      // Don't fail the request if caching fails
    }

    return NextResponse.json(emailContent);

  } catch (error) {
    console.error('Error fetching email content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PROVIDER-SPECIFIC FETCHING FUNCTIONS
// =====================================================

async function fetchFromGmailAPI(
  messageId: string,
  account: any
): Promise<EmailContentResponse> {
  try {
    console.log('🔄 Fetching from Gmail API...');
    
    // TODO: Implement Gmail API integration
    // This would use the Gmail API with OAuth tokens to fetch the message
    
    // For now, return a placeholder response
    // In production, this would:
    // 1. Use stored OAuth refresh token
    // 2. Get access token from Google
    // 3. Fetch message using Gmail API
    // 4. Parse and return content
    
    return {
      messageId,
      subject: 'Email from Gmail API',
      html: '<p>Content fetched from Gmail API would appear here</p>',
      text: 'Content fetched from Gmail API would appear here',
      attachments: [],
      success: true
    };

  } catch (error) {
    console.error('Gmail API fetch error:', error);
    return {
      messageId,
      success: false
    };
  }
}

async function fetchFromOutlookAPI(
  messageId: string,
  account: any
): Promise<EmailContentResponse> {
  try {
    console.log('🔄 Fetching from Outlook API...');
    
    // TODO: Implement Microsoft Graph API integration
    // This would use Microsoft Graph API with OAuth tokens
    
    return {
      messageId,
      subject: 'Email from Outlook API',
      html: '<p>Content fetched from Outlook API would appear here</p>',
      text: 'Content fetched from Outlook API would appear here',
      attachments: [],
      success: true
    };

  } catch (error) {
    console.error('Outlook API fetch error:', error);
    return {
      messageId,
      success: false
    };
  }
}

async function fetchFromIMAP(
  messageId: string,
  imapUid: number | undefined,
  folder: string,
  account: any
): Promise<EmailContentResponse> {
  return new Promise((resolve) => {
    try {
      console.log(`🔄 Fetching from IMAP server: ${account.imap_host}`);

      // Decrypt password (you'll need to implement this based on your encryption)
      const password = decryptPassword(account.imap_password_encrypted);

      const imap = new Imap({
        user: account.imap_username,
        password: password,
        host: account.imap_host,
        port: account.imap_port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      let emailContent: EmailContentResponse = {
        messageId,
        success: false
      };

      imap.once('ready', () => {
        console.log('📧 IMAP connection ready');
        
        imap.openBox(folder, true, (err: any, box: any) => {
          if (err) {
            console.error('Failed to open mailbox:', err);
            resolve(emailContent);
            return;
          }

          // Search for the specific message
          const searchCriteria = imapUid 
            ? [`UID ${imapUid}`]
            : [['HEADER', 'MESSAGE-ID', messageId]];

          imap.search(searchCriteria, (err: any, results: any) => {
            if (err || !results.length) {
              console.error('Message not found:', err);
              imap.end();
              resolve(emailContent);
              return;
            }

            const fetch = imap.fetch(results, { 
              bodies: '',
              struct: true,
              envelope: true
            });

            fetch.on('message', (msg: any, seqno: any) => {
              let rawEmail = '';
              
              msg.on('body', (stream: any) => {
                stream.on('data', (chunk: any) => {
                  rawEmail += chunk.toString();
                });
              });

              msg.once('end', async () => {
                try {
                  // Parse the email
                  const parsed = await simpleParser(rawEmail);
                  
                  emailContent = {
                    messageId,
                    subject: parsed.subject,
                    html: parsed.html || '',
                    text: parsed.text || '',
                    raw: rawEmail,
                    attachments: parsed.attachments?.map(att => ({
                      filename: att.filename || 'attachment',
                      contentType: att.contentType || 'application/octet-stream',
                      size: att.size || 0,
                      contentId: att.contentId
                    })) || [],
                    headers: parsed.headers,
                    success: true
                  };

                  console.log(`✅ Successfully fetched email content via IMAP`);
                } catch (parseError) {
                  console.error('Failed to parse email:', parseError);
                }
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve(emailContent);
            });

            fetch.once('error', (err: any) => {
              console.error('Fetch error:', err);
              imap.end();
              resolve(emailContent);
            });
          });
        });
      });

      imap.once('error', (err: any) => {
        console.error('IMAP connection error:', err);
        resolve(emailContent);
      });

      imap.connect();

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!emailContent.success) {
          console.error('IMAP fetch timeout');
          imap.end();
          resolve(emailContent);
        }
      }, 30000);

    } catch (error) {
      console.error('IMAP setup error:', error);
      resolve({
        messageId,
        success: false
      });
    }
  });
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function decryptPassword(encryptedPassword: string): string {
  // TODO: Implement password decryption based on your encryption method
  // This should decrypt the stored password using your encryption key
  
  // For now, assuming the password is base64 encoded
  try {
    return Buffer.from(encryptedPassword, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Failed to decrypt password:', error);
    return encryptedPassword; // Fallback to original
  }
}

// Rate limiting for API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}
