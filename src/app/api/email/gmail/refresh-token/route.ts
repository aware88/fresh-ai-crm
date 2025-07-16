import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get user's Google email account
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('provider_type', 'google')
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
        { success: false, error: 'No Google email accounts found' },
        { status: 404 }
      );
    }

    const account = accounts[0];

    if (!account.refresh_token) {
      return NextResponse.json(
        { success: false, error: 'No refresh token available. Please reconnect your Gmail account.' },
        { status: 400 }
      );
    }

    // Refresh the access token
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
      return NextResponse.json(
        { success: false, error: 'Failed to refresh access token. Please reconnect your Gmail account.' },
        { status: 400 }
      );
    }

    const tokenData = await refreshResponse.json();

    // Calculate new expiry time
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
      return NextResponse.json(
        { success: false, error: 'Failed to update access token' },
        { status: 500 }
      );
    }

    console.log(`Successfully refreshed token for ${account.email}`);

    return NextResponse.json({
      success: true,
      message: 'Access token refreshed successfully',
      expires_at: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 