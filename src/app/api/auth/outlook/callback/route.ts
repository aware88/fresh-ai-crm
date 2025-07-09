import { NextResponse } from 'next/server';
import { MicrosoftTokenService } from '@/lib/services/microsoft-token-service';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/outlook/callback`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    
    // Handle errors from OAuth provider
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`/settings/email?error=${encodeURIComponent(error)}`);
    }
    
    // Validate required parameters
    if (!code || !stateParam) {
      console.error('Missing required OAuth parameters');
      return NextResponse.redirect('/settings/email?error=Invalid OAuth response');
    }
    
    // Decode state parameter to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      userId = stateData.userId;
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect('/settings/email?error=Invalid state parameter');
    }
    
    if (!userId) {
      return NextResponse.redirect('/settings/email?error=User ID not found in state');
    }
    
    // Log the OAuth flow progress
    console.log(`Outlook callback: Processing OAuth code for user ${userId}`);
    
    // Verify Microsoft OAuth configuration
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      console.error('Outlook callback: Missing Microsoft OAuth credentials');
      return NextResponse.redirect('/settings/email?error=Missing Microsoft OAuth credentials');
    }
    
    // Exchange authorization code for tokens
    console.log('Outlook callback: Exchanging code for tokens');
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect('/settings/email?error=Failed to exchange code for tokens');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Calculate token expiration time
    const expiresAt = Math.floor(Date.now() / 1000) + tokenData.expires_in;
    
    // Store tokens in the database
    await MicrosoftTokenService.storeTokens(
      userId,
      tokenData.access_token,
      tokenData.refresh_token,
      expiresAt
    );
    
    // Redirect back to the email settings page with success message
    return NextResponse.redirect('/settings/email?success=true');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect('/settings/email?error=An unexpected error occurred');
  }
}
