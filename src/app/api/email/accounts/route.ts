import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get user's email accounts with sync information
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select(`
        id,
        email_address,
        last_sync_at,
        last_followup_sync_at,
        sync_error,
        created_at,
        updated_at
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
      count: accounts?.length || 0
    });

  } catch (error) {
    console.error('Error in email accounts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}