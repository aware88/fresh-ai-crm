import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

// Function to get the correct base URL for redirects
function getBaseUrl(request: Request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  // If we're in development and accessing via 127.0.0.1, use that
  if (host && host.includes('127.0.0.1')) {
    return `${protocol}://${host}`;
  }
  
  // Otherwise use the configured NEXTAUTH_URL
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const stateParam = searchParams.get('state');
    
    // Get the correct base URL for redirects
    const BASE_URL = getBaseUrl(request);
    
    // Handle errors from OAuth provider
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL(`/settings/email-accounts?error=${encodeURIComponent(error)}`, BASE_URL));
    }
    
    // Validate required parameters
    if (!code || !stateParam) {
      console.error('Missing required OAuth parameters');
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Invalid OAuth response', BASE_URL));
    }
    
    // Decode state parameter to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      userId = stateData.userId;
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Invalid state parameter', BASE_URL));
    }
    
    if (!userId) {
      return NextResponse.redirect(new URL('/settings/email-accounts?error=User ID not found in state', BASE_URL));
    }
    
    // Log the OAuth flow progress
    console.log(`Google callback: Processing OAuth code for user ${userId}`);
    
    // Verify Google OAuth configuration
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google callback: Missing Google OAuth credentials');
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Missing Google OAuth credentials', BASE_URL));
    }
    
    // Exchange authorization code for tokens
    console.log('Google callback: Exchanging code for tokens');
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
    const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);
    
    // Store the email account in the database
    const supabase = createServiceRoleClient();
    
    // Check if this email already exists for this user
    let existingAccount = null;
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('email', userInfo.email)
        .eq('provider_type', 'google')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking for existing account:', error);
      } else {
        existingAccount = data;
      }
    } catch (err) {
      console.error('Exception checking for existing account:', err);
    }
    
    // Create account data object with only the columns we know exist
    const accountData: any = {
      user_id: userId,
      email: userInfo.email,
      provider_type: 'google',
      is_active: true
    };
    
    // Try to add optional fields that might exist
    if (userInfo.name) {
      accountData.display_name = userInfo.name;
    }
    
    let result;
    try {
      if (existingAccount) {
        // Update existing account with minimal fields
        result = await supabase
          .from('email_accounts')
          .update({
            is_active: true,
            ...(userInfo.name && { display_name: userInfo.name })
          })
          .eq('id', existingAccount.id)
          .select();
      } else {
        // Insert new account with minimal fields
        result = await supabase
          .from('email_accounts')
          .insert([accountData])
          .select();
      }
      
      if (result.error) {
        console.error('Error storing Google email account:', result.error);
        
        // If the insert fails, try with even fewer fields
        if (!existingAccount) {
          const minimalData = {
            user_id: userId,
            email: userInfo.email,
            provider_type: 'google'
          };
          
          const retryResult = await supabase
            .from('email_accounts')
            .insert([minimalData])
            .select();
            
          if (retryResult.error) {
            console.error('Retry insert also failed:', retryResult.error);
            throw retryResult.error;
          }
          
          result = retryResult;
        } else {
          throw result.error;
        }
      }
      
      console.log('Successfully stored/updated Google account for:', userInfo.email);
      
      // Store OAuth tokens separately in a secure way (you could use a separate table or encrypted storage)
      // For now, we'll just log them (don't do this in production)
      console.log('OAuth tokens received (store these securely):', {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(expiresAt * 1000).toISOString()
      });
      
      // Redirect back to the email settings page with success message
      return NextResponse.redirect(new URL('/settings/email-accounts?success=true&provider=google', BASE_URL));
    } catch (err) {
      console.error('Exception storing Google email account:', err);
      return NextResponse.redirect(new URL('/settings/email-accounts?error=Failed to store email account', BASE_URL));
    }
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    const BASE_URL = getBaseUrl(request);
    return NextResponse.redirect(new URL('/settings/email-accounts?error=An unexpected error occurred', BASE_URL));
  }
} 