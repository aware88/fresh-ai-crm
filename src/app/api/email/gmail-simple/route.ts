import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

async function refreshGoogleToken(account: any, supabase: any) {
  try {
    console.log(`Refreshing token for ${account.email}...`);
    
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      console.error('Failed to refresh token:', refreshResponse.status, refreshResponse.statusText);
      return null;
    }

    const tokenData = await refreshResponse.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update the account with new token
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({
        access_token: tokenData.access_token,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Error updating access token:', updateError);
      return null;
    }

    console.log(`Successfully refreshed token for ${account.email}`);
    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pagination and folder parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const pageToken = searchParams.get('pageToken') || '';
    const folder = searchParams.get('folder') || 'INBOX';

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // Get user's email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (accountsError) {
      console.error('Error fetching email accounts:', accountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email accounts' },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No email accounts found' },
        { status: 404 }
      );
    }

    // Find Google account
    const googleAccount = accounts.find(acc => acc.provider_type === 'google');
    
    if (!googleAccount) {
      return NextResponse.json(
        { success: false, error: 'No Google account found' },
        { status: 404 }
      );
    }

    // Check if we have access token
    if (!googleAccount.access_token) {
      return NextResponse.json(
        { success: false, error: 'No access token available. Please reconnect your Gmail account.' },
        { status: 401 }
      );
    }

    let accessToken = googleAccount.access_token;

    // Check if token is expired and refresh if needed
    if (googleAccount.token_expires_at) {
      const now = new Date();
      const tokenExpiry = new Date(googleAccount.token_expires_at);
      
      if (tokenExpiry <= now) {
        console.log('Access token expired, attempting to refresh...');
        
        if (!googleAccount.refresh_token) {
          return NextResponse.json(
            { success: false, error: 'Access token expired and no refresh token available. Please reconnect your Gmail account.' },
            { status: 401 }
          );
        }

        accessToken = await refreshGoogleToken(googleAccount, supabase);
        
        if (!accessToken) {
          return NextResponse.json(
            { success: false, error: 'Failed to refresh access token. Please reconnect your Gmail account.' },
            { status: 401 }
          );
        }
      }
    }

    // Map folder names to Gmail labels/queries
    let query = 'in:inbox'; // default
    if (folder.toLowerCase() === 'sent') {
      query = 'in:sent';
    } else if (folder.toLowerCase() === 'drafts') {
      query = 'in:drafts';
    } else if (folder.toLowerCase() === 'inbox') {
      query = 'in:inbox';
    }
    
    // Build Gmail API URL with pagination and folder support
    let gmailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&q=${query}`;
    if (pageToken) {
      gmailUrl += `&pageToken=${pageToken}`;
    }

    // Fetch emails from Gmail API
    console.log(`Fetching emails for ${googleAccount.email}...`);
    const gmailResponse = await fetch(gmailUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!gmailResponse.ok) {
      console.error('Gmail API error:', gmailResponse.status, gmailResponse.statusText);
      
      if (gmailResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Gmail API authentication failed. Please reconnect your Gmail account.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch emails from Gmail API' },
        { status: 500 }
      );
    }

    const gmailData = await gmailResponse.json();

    if (!gmailData.messages || gmailData.messages.length === 0) {
      return NextResponse.json({
        success: true,
        emails: [],
        account: googleAccount.email,
        count: 0,
        pagination: {
          page: page,
          limit: limit,
          hasNextPage: false,
          nextPageToken: null
        }
      });
    }

    // Fetch details for each message
    const emails = [];
    
    for (const message of gmailData.messages) {
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        );

        if (!messageResponse.ok) {
          console.error(`Failed to fetch message ${message.id}`);
          continue;
        }

        const messageData = await messageResponse.json();
        
        // Extract email details
        const headers = messageData.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name === 'Date')?.value;
        
        // Get email body - prioritize HTML content for rich display
        let body = '';
        if (messageData.payload.body && messageData.payload.body.data) {
          body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
        } else if (messageData.payload.parts) {
          // Handle multipart messages - prioritize HTML over plain text
          const htmlPart = messageData.payload.parts.find((part: any) => 
            part.mimeType === 'text/html'
          );
          const textPart = messageData.payload.parts.find((part: any) => 
            part.mimeType === 'text/plain'
          );
          
          // Use HTML if available, otherwise fallback to plain text
          const preferredPart = htmlPart || textPart;
          if (preferredPart && preferredPart.body && preferredPart.body.data) {
            body = Buffer.from(preferredPart.body.data, 'base64').toString('utf-8');
          }
        }

        emails.push({
          id: messageData.id,
          from: from,
          subject: subject,
          body: body,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          read: !messageData.labelIds?.includes('UNREAD'),
          folder: folder.toLowerCase(),
          attachments: []
        });

      } catch (messageError) {
        console.error(`Error processing message ${message.id}:`, messageError);
      }
    }

    console.log(`Successfully fetched ${emails.length} emails from Gmail`);

    return NextResponse.json({
      success: true,
      emails: emails,
      account: googleAccount.email,
      count: emails.length,
      pagination: {
        page: page,
        limit: limit,
        hasNextPage: !!gmailData.nextPageToken,
        nextPageToken: gmailData.nextPageToken || null,
        totalEstimate: gmailData.resultSizeEstimate || 0
      }
    });

  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 