import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Get email accounts from database
    const { data: emailAccounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 });
    }

    // Transform accounts for the response
    const accounts = emailAccounts?.map(account => ({
      id: account.id,
      email: account.email,
      provider_type: account.provider_type,
      name: account.display_name || account.email,
      status: account.is_active ? 'active' : 'inactive',
      created_at: account.created_at,
      updated_at: account.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      accounts: accounts,
      count: accounts.length
    });

  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}