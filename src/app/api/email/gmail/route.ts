import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Get user's Google email account
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('provider_type', 'google')
      .eq('is_active', true)
      .not('access_token', 'is', null);

    if (accountsError) {
      console.error('Error fetching email accounts:', accountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email accounts' },
        { status: 500 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active Google email accounts found' },
        { status: 404 }
      );
    }

    const account = accounts[0]; // Use the first account

    // Check if token is expired
    const now = new Date();
    const tokenExpiry = new Date(account.token_expires_at);
    
    if (tokenExpiry <= now) {
      return NextResponse.json(
        { success: false, error: 'Access token expired. Please reconnect your Gmail account.' },
        { status: 401 }
      );
    }

    // Fetch emails from Gmail API
    const gmailResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox',
      {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!gmailResponse.ok) {
      console.error('Gmail API error:', gmailResponse.status, gmailResponse.statusText);
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
        account: account.email
      });
    }

    // Fetch details for each message
    const emails = [];
    
    for (const message of gmailData.messages.slice(0, 10)) {
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${account.access_token}`,
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
        const to = headers.find((h: any) => h.name === 'To')?.value || account.email;
        const date = headers.find((h: any) => h.name === 'Date')?.value;
        
        // Get email body
        let body = '';
        if (messageData.payload.body && messageData.payload.body.data) {
          body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
        } else if (messageData.payload.parts) {
          // Handle multipart messages
          const textPart = messageData.payload.parts.find((part: any) => 
            part.mimeType === 'text/plain' || part.mimeType === 'text/html'
          );
          if (textPart && textPart.body && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        }

        emails.push({
          id: messageData.id,
          from: from,
          subject: subject,
          body: body,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          read: !messageData.labelIds?.includes('UNREAD'),
          folder: 'inbox',
          attachments: []
        });

      } catch (messageError) {
        console.error(`Error processing message ${message.id}:`, messageError);
      }
    }

    return NextResponse.json({
      success: true,
      emails: emails,
      account: account.email,
      count: emails.length
    });

  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 