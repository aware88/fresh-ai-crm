import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;

// Function to get the correct redirect URI
function getRedirectUri(request: Request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  // Always use the request host for dynamic URL detection
  return `${protocol}://${host}/api/auth/outlook/callback`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    
    // Handle errors from OAuth provider
    if (error) {
      console.error('Microsoft OAuth error:', error);
      return NextResponse.redirect(`/settings/email-accounts?error=${encodeURIComponent(error)}`);
    }
    
    // Validate required parameters
    if (!code || !stateParam) {
      console.error('Missing required OAuth parameters');
      return NextResponse.redirect('/settings/email-accounts?error=Invalid OAuth response');
    }
    
    // Decode state parameter to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      userId = stateData.userId;
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect('/settings/email-accounts?error=Invalid state parameter');
    }
    
    if (!userId) {
      return NextResponse.redirect('/settings/email-accounts?error=User ID not found in state');
    }
    
    // Log the OAuth flow progress
    console.log(`Microsoft callback: Processing OAuth code for user ${userId}`);
    
    // Verify Microsoft OAuth configuration
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      console.error('Microsoft callback: Missing Microsoft OAuth credentials');
      return NextResponse.redirect('/settings/email-accounts?error=Missing Microsoft OAuth credentials');
    }
    
    // Exchange authorization code for tokens
    console.log('Microsoft callback: Exchanging code for tokens');
    
    // Get the redirect URI dynamically
    const redirectUri = getRedirectUri(request);
    
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect('/settings/email-accounts?error=Failed to exchange code for tokens');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Microsoft Graph');
      return NextResponse.redirect('/settings/email-accounts?error=Failed to get user info');
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Calculate token expiration time
    const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);
    
    // Store the email account in the database
    const supabase = createServiceRoleClient();
    
    // Check if this email already exists for this user
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('email', userInfo.mail || userInfo.userPrincipalName)
      .eq('provider_type', 'microsoft')
      .maybeSingle();
    
    let result;
    
    if (existingAccount) {
      // Update existing account
      result = await supabase
        .from('email_accounts')
        .update({
          display_name: userInfo.displayName || userInfo.mail || userInfo.userPrincipalName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(expiresAt * 1000).toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id)
        .select();
    } else {
      // Insert new account
      result = await supabase
        .from('email_accounts')
        .insert([
          {
            user_id: userId,
            email: userInfo.mail || userInfo.userPrincipalName,
            display_name: userInfo.displayName || userInfo.mail || userInfo.userPrincipalName,
            provider_type: 'microsoft',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(expiresAt * 1000).toISOString(),
            is_active: true
          }
        ])
        .select();
    }
    
    if (result.error) {
      console.error('Error storing Microsoft email account:', result.error);
      return NextResponse.redirect('/settings/email-accounts?error=Failed to store email account');
    }
    
    // Redirect back to the email settings page with success message
    return NextResponse.redirect('/settings/email-accounts?success=true&provider=microsoft');
  } catch (error) {
    console.error('Error in Microsoft OAuth callback:', error);
    return NextResponse.redirect('/settings/email-accounts?error=An unexpected error occurred');
  }
}
