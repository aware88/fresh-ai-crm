import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { canAddMoreEmailAccounts } from '@/lib/subscription-feature-check';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT =
  process.env.MICROSOFT_TENANT_ID || process.env.MICROSOFT_AUTH_TENANT || 'common';

// Function to get the correct base URL for redirects
function getBaseUrl(request: Request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const configuredBase = process.env.NEXTAUTH_URL?.replace(/\/$/, '');

  // Prefer configured base in prod. In dev, if NEXTAUTH_URL points to localhost,
  // use it to avoid random dev proxy ports; otherwise fall back to the request host.
  const isLocal = host?.startsWith('localhost:');
  const useConfiguredLocal = configuredBase && /localhost(:\d+)?$/.test(new URL(configuredBase).host);
  return configuredBase && (!isLocal || useConfiguredLocal)
    ? configuredBase
    : `${protocol}://${host}`;
}

// Function to get the correct redirect URI
function getRedirectUri(request: Request) {
  const base = getBaseUrl(request);
  return `${base}/api/auth/outlook/callback`;
}

export async function GET(request: Request) {
  const BASE_URL = getBaseUrl(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    
    // Handle errors from OAuth provider
    if (error) {
      console.error('Microsoft OAuth error:', error);
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=${encodeURIComponent(error)}`);
    }
    
    // Validate required parameters
    if (!code || !stateParam) {
      console.error('Missing required OAuth parameters');
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Invalid OAuth response`);
    }
    
    // Decode state parameter to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      userId = stateData.userId;
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Invalid state parameter`);
    }
    
    if (!userId) {
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=User ID not found in state`);
    }
    
    // Log the OAuth flow progress
    console.log(`Microsoft callback: Processing OAuth code for user ${userId}`);
    
    // Verify Microsoft OAuth configuration
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      console.error('Microsoft callback: Missing Microsoft OAuth credentials');
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Missing Microsoft OAuth credentials`);
    }
    
    // Exchange authorization code for tokens
    console.log('Microsoft callback: Exchanging code for tokens');
    
    // Get the redirect URI dynamically
    const redirectUri = getRedirectUri(request);
    
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2.0/token`,
      {
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
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Failed to exchange code for tokens`);
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
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Failed to get user info`);
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Calculate token expiration time
    const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);
    
    // Store the email account in the database
    const supabase = createServiceRoleClient();
    
    // Get user's current organization for subscription checking
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs?.current_organization_id) {
      console.error('Microsoft OAuth: Could not find user organization:', prefsError);
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Could not determine organization for subscription check`);
    }

    const organizationId = userPrefs.current_organization_id;

    // Check if this email already exists for this user or organization
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .or(`user_id.eq.${userId},organization_id.eq.${organizationId}`)
      .eq('email', userInfo.mail || userInfo.userPrincipalName)
      .eq('provider_type', 'microsoft')
      .maybeSingle();

    // If this is a new account (not updating existing), check subscription limits
    if (!existingAccount) {
      // Count current email accounts for this organization
      const { count: currentEmailAccountCount, error: countError } = await supabase
        .from('email_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        console.error('Error counting email accounts:', countError);
        return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Failed to check email account limits`);
      }

      // Check if organization can add more email accounts
      const { canAdd, reason } = await canAddMoreEmailAccounts(
        organizationId, 
        currentEmailAccountCount || 0
      );

      if (!canAdd) {
        return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=${encodeURIComponent(reason || 'Email account limit reached')}`);
      }
    }
    
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
            organization_id: organizationId,
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
      return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=Failed to store email account`);
    }

    // Get the account ID and trigger automatic setup for new accounts
    const newAccountId = result.data?.[0]?.id;
    const isNewAccount = !existingAccount;
    
    if (newAccountId && isNewAccount) {
      console.log(`🚀 Triggering automatic setup for new Microsoft account: ${newAccountId}`);
      
      // Trigger setup in background (don't wait for completion)
      fetch(`${BASE_URL}/api/email/setup-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Internal-Auto-Setup'
        },
        body: JSON.stringify({
          accountId: newAccountId,
          isNewAccount: true,
          catchUpMode: false
        })
      }).catch(setupError => {
        console.error('Background setup failed (non-blocking):', setupError);
      });
    }
    
    // Redirect back to the email settings page with success message
    const successMessage = isNewAccount 
      ? 'Microsoft account connected - setup running in background'
      : 'Microsoft account updated successfully';
      
    return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?success=${encodeURIComponent(successMessage)}&provider=microsoft`);
  } catch (error) {
    console.error('Error in Microsoft OAuth callback:', error);
    return NextResponse.redirect(`${BASE_URL}/settings/email-accounts?error=An unexpected error occurred`);
  }
}
