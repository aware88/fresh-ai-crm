import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyzeEmail } from '@/lib/openai/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await request.json();
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // Get user's Gmail account
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('provider_type', 'google')
      .eq('is_active', true)
      .not('access_token', 'is', null);

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No Gmail account found' }, { status: 404 });
    }

    const account = accounts[0];
    let accessToken = account.access_token;

    // Check if token is expired and refresh if needed
    if (account.token_expires_at) {
      const now = new Date();
      const tokenExpiry = new Date(account.token_expires_at);
      
      if (tokenExpiry <= now) {
        // Refresh token logic (similar to gmail-simple route)
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

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          accessToken = tokenData.access_token;
          
          // Update the account with new token
          await supabase
            .from('email_accounts')
            .update({
              access_token: tokenData.access_token,
              token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            })
            .eq('id', account.id);
        }
      }
    }

    // Fetch the specific email from Gmail API
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!messageResponse.ok) {
      console.error('Failed to fetch email from Gmail:', messageResponse.status);
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const messageData = await messageResponse.json();
    
    // Extract email details
    const headers = messageData.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
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

    // Create email content for analysis
    const emailContent = `From: ${from}
Subject: ${subject}
Date: ${date}

${body}`;

    // Analyze the email content
    const analysisResult = await analyzeEmail(emailContent);

    // Parse the JSON string returned by analyzeEmail
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse analysis result:', parseError);
      console.error('Raw analysis result:', analysisResult);
      
      // Return a fallback response
      parsedAnalysis = {
        analysis: {
          personality: {
            traits: ['Analysis parsing failed'],
            communication_style: 'Unknown',
            tone: 'Unknown'
          },
          context: {
            relationship_type: 'Unknown',
            urgency_level: 'Medium',
            topic_category: 'General'
          },
          insights: {
            key_points: ['Failed to parse analysis results'],
            sentiment: 'Unknown',
            intent: 'Unknown'
          },
          recommendations: {
            response_suggestions: ['Please try again'],
            next_steps: ['Check system configuration']
          }
        },
        error: 'Failed to parse analysis results',
        raw_response: analysisResult.substring(0, 500)
      };
    }

    return NextResponse.json({
      success: true,
      analysis: parsedAnalysis,
      email: {
        from: from,
        subject: subject,
        id: emailId,
        date: date
      }
    });
  } catch (error) {
    console.error('Error analyzing email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
