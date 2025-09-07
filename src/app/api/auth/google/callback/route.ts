import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canAddMoreEmailAccounts } from '@/lib/subscription-feature-check';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Function to get the correct base URL for redirects
function getBaseUrl(request: Request) {
  // Use NEXTAUTH_URL for reliable redirects in production
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

// Function to ensure OAuth columns exist
async function ensureOAuthColumns(supabase: any) {
  try {
    // Try to select OAuth columns to check if they exist
    const { data, error } = await supabase
      .from('email_accounts')
      .select('access_token, refresh_token, token_expires_at, display_name')
      .limit(1);
    
    if (error && error.code === '42703') {
      // Columns don't exist, but we can't create them here
      console.log('OAuth columns missing - they should be added via migration');
    }
  } catch (error) {
    console.error('Error checking OAuth columns:', error);
  }
}

export async function GET(request: Request) {
  const BASE_URL = getBaseUrl(request);
  const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;
  
  try {
    // Get session to ensure user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.error('No authenticated user found during OAuth callback');
      return NextResponse.redirect(new URL('/signin?error=No authenticated user', BASE_URL));
    }
    
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL(`/settings/email-accounts?error=${encodeURIComponent(error)}`, BASE_URL));
    }
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/settings/email-accounts?error=No authorization code', BASE_URL));
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Failed to exchange code for tokens', BASE_URL));
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Google');
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Failed to get user info', BASE_URL));
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);
    
    // Store the email account in the database
    const supabase = createServiceRoleClient();
    
    // Ensure OAuth columns exist
    await ensureOAuthColumns(supabase);
    
    // Get user's current organization for subscription checking
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (prefsError || !userPrefs?.current_organization_id) {
      console.error('Google OAuth: Could not find user organization:', prefsError);
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Could not determine organization for subscription check', BASE_URL));
    }

    const organizationId = userPrefs.current_organization_id;

    // Check if this email already exists for this user or organization
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .or(`user_id.eq.${session.user.id},organization_id.eq.${organizationId}`)
      .eq('email', userInfo.email)
      .eq('provider_type', 'google')
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing account:', checkError);
    }

    // If this is a new account (not updating existing), check subscription limits
    if (!existingAccount) {
      // Count current email accounts for this organization
      const { count: currentEmailAccountCount, error: countError } = await supabase
        .from('email_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        console.error('Error counting email accounts:', countError);
        return NextResponse.redirect(new URL('/settings/email-accounts?error=Failed to check email account limits', BASE_URL));
      }

      // Check if organization can add more email accounts
      const { canAdd, reason } = await canAddMoreEmailAccounts(
        organizationId, 
        currentEmailAccountCount || 0
      );

      if (!canAdd) {
        return NextResponse.redirect(new URL(`/settings/email-accounts?error=${encodeURIComponent(reason || 'Email account limit reached')}`, BASE_URL));
      }
    }
    
    // Prepare the account data with fallback for missing columns
    const accountData = {
      user_id: session.user.id,
      organization_id: organizationId,
      email: userInfo.email,
      provider_type: 'google',
      display_name: userInfo.name || userInfo.email,
      is_active: true,
      updated_at: new Date().toISOString()
    };
    
    // Try to include OAuth tokens if columns exist
    try {
      const fullAccountData = {
        ...accountData,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString()
      };
      
      let result;
      
      if (existingAccount) {
        // Update existing account
        result = await supabase
          .from('email_accounts')
          .update(fullAccountData)
          .eq('id', existingAccount.id)
          .select()
          .single();
      } else {
        // Insert new account
        result = await supabase
          .from('email_accounts')
          .insert([fullAccountData])
          .select()
          .single();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('✅ Successfully stored Google account with OAuth tokens');
      
    } catch (oauthError) {
      console.warn('OAuth columns not available, storing basic account info:', oauthError);
      
      // Fall back to basic account data without OAuth tokens
      let result;
      
      if (existingAccount) {
        // Update existing account
        result = await supabase
          .from('email_accounts')
          .update(accountData)
          .eq('id', existingAccount.id)
          .select()
          .single();
      } else {
        // Insert new account
        result = await supabase
          .from('email_accounts')
          .insert([accountData])
          .select()
          .single();
      }
      
      if (result.error) {
        console.error('Error storing email account:', result.error);
        return NextResponse.redirect(new URL('/settings/email-accounts?error=Failed to store account', BASE_URL));
      }
      
      console.log('⚠️  Stored Google account without OAuth tokens (columns missing)');
    }
    
    // Get the final account ID for setup trigger
    const finalAccountId = result?.data?.id;
    
    // Success - trigger automatic setup for new accounts
    if (finalAccountId && !existingAccount) {
      console.log(`🚀 Triggering automatic setup for new Google account: ${finalAccountId}`);
      
      // Trigger setup in background (don't wait for completion)
      fetch(`${BASE_URL}/api/email/setup-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Internal-Auto-Setup'
        },
        body: JSON.stringify({
          accountId: finalAccountId,
          isNewAccount: true,
          catchUpMode: false
        })
      }).catch(setupError => {
        console.error('Background setup failed (non-blocking):', setupError);
      });
    }
    
    // Redirect with success message and setup info
    const successMessage = existingAccount 
      ? 'Google account updated successfully'
      : 'Google account connected successfully - setup running in background';
      
    return NextResponse.redirect(new URL(`/settings/email-accounts?success=${encodeURIComponent(successMessage)}`, BASE_URL));
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings/email-accounts?error=OAuth callback failed', BASE_URL));
  }
} 