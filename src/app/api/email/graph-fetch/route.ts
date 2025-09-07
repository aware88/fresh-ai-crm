import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';

async function graphGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph error ${res.status}: ${body}`);
  }
  return res.json();
}

// POST handler for fetching a single Microsoft Graph message by message ID
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

    console.log(`📧 [Graph-Fetch] POST request for messageId: ${messageId}, accountId: ${accountId}`);

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // First, verify the account and get access token
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .in('provider_type', ['microsoft', 'outlook'])
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.log(`⚠️ [Graph-Fetch] Microsoft account not found: ${accountId}`);
      return NextResponse.json(
        { success: false, error: 'Microsoft account not found or access denied' },
        { status: 404 }
      );
    }

    // Get valid access token
    const valid = await getValidMicrosoftAccessToken({ userId: session.user.id, accountId });
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'No valid Microsoft token' },
        { status: 401 }
      );
    }

    const accessToken = valid.accessToken;

    // Microsoft message IDs in our system might be stored differently
    // Need to find the actual Graph message ID from our email_index
    const { data: emailIndex, error: indexError } = await supabase
      .from('email_index')
      .select('*')
      .eq('message_id', messageId)
      .eq('email_account_id', accountId)
      .single();

    if (indexError || !emailIndex) {
      console.log(`⚠️ [Graph-Fetch] Email not found in index: ${messageId}`);
      return NextResponse.json(
        { success: false, error: 'Email not found in index' },
        { status: 404 }
      );
    }

    // Use the stored Graph message ID (might need to extract from messageId)
    let graphMessageId = messageId;
    
    // If the message ID looks like a Microsoft format, use it directly
    // Otherwise, try to find it using search
    try {
      console.log(`📧 [Graph-Fetch] Fetching Graph message: ${graphMessageId}`);
      
      // Try direct fetch first
      let message;
      try {
        message = await graphGet(
          `https://graph.microsoft.com/v1.0/me/messages/${graphMessageId}?$select=id,subject,body,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,hasAttachments,attachments`,
          accessToken
        );
      } catch (directError: any) {
        console.log(`📧 [Graph-Fetch] Direct fetch failed, trying search approach: ${directError.message}`);
        
        // If direct fetch fails, try to search for the message
        // This handles cases where the message ID format might be different
        const searchQuery = `$search="${emailIndex.subject || ''}"`;
        const folderPath = emailIndex.folder_name?.toLowerCase() === 'sent' ? 'sentitems' : 'inbox';
        
        const searchUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderPath}/messages?${searchQuery}&$top=10&$select=id,subject,body,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,hasAttachments,attachments`;
        const searchResults = await graphGet(searchUrl, accessToken);
        
        // Find the message with matching metadata
        const matchingMessage = searchResults.value?.find((msg: any) => {
          const fromMatch = msg.from?.emailAddress?.address === emailIndex.sender_email;
          const subjectMatch = msg.subject === emailIndex.subject;
          const dateMatch = new Date(msg.receivedDateTime || msg.sentDateTime).getTime() === new Date(emailIndex.received_at).getTime();
          
          return fromMatch && (subjectMatch || dateMatch);
        });

        if (!matchingMessage) {
          throw new Error('Message not found on server');
        }

        // Fetch the full message content
        message = await graphGet(
          `https://graph.microsoft.com/v1.0/me/messages/${matchingMessage.id}?$select=id,subject,body,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,hasAttachments,attachments`,
          accessToken
        );
      }

      console.log(`✅ [Graph-Fetch] Successfully fetched Graph message: ${message.subject || 'No Subject'}`);

      // Extract content from the message body
      const html = message.body?.contentType === 'html' ? message.body.content : null;
      const text = message.body?.contentType === 'text' ? message.body.content : 
                  (html ? null : message.bodyPreview || message.body?.content || null);

      // Extract attachments info
      const attachments = (message.attachments || []).map((att: any) => ({
        filename: att.name,
        contentType: att.contentType,
        size: att.size || 0,
        id: att.id
      }));

      // Get raw content (Microsoft Graph doesn't provide MIME format directly)
      let rawContent = null;
      try {
        const mimeMessage = await graphGet(
          `https://graph.microsoft.com/v1.0/me/messages/${message.id}/$value`,
          accessToken
        );
        rawContent = mimeMessage;
      } catch (rawError) {
        console.warn('Could not fetch raw MIME content:', rawError);
        // Fallback: construct basic raw content
        rawContent = `Subject: ${message.subject || ''}\r\nFrom: ${message.from?.emailAddress?.address || ''}\r\nTo: ${message.toRecipients?.map((t: any) => t.emailAddress?.address).join(', ') || ''}\r\nDate: ${message.receivedDateTime || message.sentDateTime || ''}\r\n\r\n${text || html || ''}`;
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

    } catch (graphError: any) {
      console.error('Error fetching from Microsoft Graph API:', graphError);
      return NextResponse.json(
        { success: false, error: `Microsoft Graph API error: ${graphError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in Microsoft Graph fetch POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Microsoft Graph content' },
      { status: 500 }
    );
  }
}