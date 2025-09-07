import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getValidGoogleAccessToken } from '@/lib/services/google-token';

async function gmailGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail error ${res.status}: ${body}`);
  }
  return res.json();
}

function extractBody(payload: any): { html: string | null; text: string | null } {
  let html = null;
  let text = null;

  function traverse(part: any) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text = Buffer.from(part.body.data, 'base64url').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
    } else if (part.parts) {
      part.parts.forEach(traverse);
    }
  }

  if (payload.body?.data) {
    // Simple message
    if (payload.mimeType === 'text/plain') {
      text = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    } else if (payload.mimeType === 'text/html') {
      html = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }
  } else if (payload.parts) {
    // Multipart message
    payload.parts.forEach(traverse);
  }

  return { html, text };
}

// POST handler for fetching a single Gmail message by message ID
export async function POST(request: Request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { accountId, messageId, folder = 'INBOX' } = await request.json();
    
    if (!accountId || !messageId) {
      return NextResponse.json(
        { success: false, error: 'Account ID and Message ID are required' },
        { status: 400 }
      );
    }

    console.log(`📧 [Gmail-Fetch] POST request for messageId: ${messageId}, accountId: ${accountId}`);

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // First, verify the account and get access token
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .eq('provider_type', 'google')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.log(`⚠️ [Gmail-Fetch] Gmail account not found: ${accountId}`);
      return NextResponse.json(
        { success: false, error: 'Gmail account not found or access denied' },
        { status: 404 }
      );
    }

    // Get valid access token
    const valid = await getValidGoogleAccessToken({ userId: session.user.id, accountId });
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'No valid Google token' },
        { status: 401 }
      );
    }

    const accessToken = valid.accessToken;

    // Gmail message IDs in our system might be stored in different formats
    // Need to find the actual Gmail message ID from our email_index
    const { data: emailIndex, error: indexError } = await supabase
      .from('email_index')
      .select('*')
      .eq('message_id', messageId)
      .eq('email_account_id', accountId)
      .single();

    if (indexError || !emailIndex) {
      console.log(`⚠️ [Gmail-Fetch] Email not found in index: ${messageId}`);
      return NextResponse.json(
        { success: false, error: 'Email not found in index' },
        { status: 404 }
      );
    }

    // Use the stored Gmail message ID (could be stored in various fields)
    let gmailMessageId = messageId;
    
    // Check if we have a raw Gmail ID stored somewhere
    if (emailIndex.imap_uid) {
      gmailMessageId = emailIndex.imap_uid.toString();
    }

    try {
      console.log(`📧 [Gmail-Fetch] Fetching Gmail message: ${gmailMessageId}`);
      
      // Fetch the full message from Gmail API
      const message = await gmailGet(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}?format=full`,
        accessToken
      );

      console.log(`✅ [Gmail-Fetch] Successfully fetched Gmail message: ${message.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject'}`);

      // Extract body content
      const { html, text } = extractBody(message.payload);

      // Get raw message if available
      let rawContent = null;
      try {
        const rawMessage = await gmailGet(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}?format=raw`,
          accessToken
        );
        if (rawMessage.raw) {
          rawContent = Buffer.from(rawMessage.raw, 'base64url').toString('utf-8');
        }
      } catch (rawError) {
        console.warn('Could not fetch raw message:', rawError);
      }

      // Extract attachments info
      const attachments: any[] = [];
      function findAttachments(part: any) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            attachmentId: part.body.attachmentId
          });
        }
        if (part.parts) {
          part.parts.forEach(findAttachments);
        }
      }

      if (message.payload.parts) {
        message.payload.parts.forEach(findAttachments);
      }

      // Return the content in the expected format
      return NextResponse.json({
        success: true,
        messageId: messageId,
        html: html,
        text: text,
        raw: rawContent,
        attachments: attachments
      });

    } catch (gmailError: any) {
      console.error('Error fetching from Gmail API:', gmailError);
      return NextResponse.json(
        { success: false, error: `Gmail API error: ${gmailError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in Gmail fetch POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Gmail content' },
      { status: 500 }
    );
  }
}