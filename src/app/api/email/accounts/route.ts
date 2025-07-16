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

    // Get all email accounts for this user
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id);

    if (accountsError) {
      console.error('Error fetching email accounts:', accountsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email accounts' },
        { status: 500 }
      );
    }

    // Get Google accounts specifically
    const googleAccounts = accounts?.filter(acc => acc.provider_type === 'google') || [];
    const activeGoogleAccounts = googleAccounts.filter(acc => acc.is_active);

    return NextResponse.json({
      success: true,
      user_id: session.user.id,
      total_accounts: accounts?.length || 0,
      google_accounts: googleAccounts.length,
      active_google_accounts: activeGoogleAccounts.length,
      accounts: accounts?.map(acc => ({
        id: acc.id,
        email: acc.email,
        provider_type: acc.provider_type,
        is_active: acc.is_active,
        has_access_token: !!acc.access_token,
        token_expires_at: acc.token_expires_at,
        created_at: acc.created_at
      })) || []
    });

  } catch (error) {
    console.error('Email accounts API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 