import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 /api/email/accounts - Session:', session ? 'found' : 'not found');
    console.log('🔍 /api/email/accounts - User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('❌ /api/email/accounts - No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get user's email accounts with sync information
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select(`
        id,
        email,
        last_sync_at,
        sync_error,
        created_at,
        updated_at
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ /api/email/accounts - Error fetching email accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 });
    }

    console.log(`✅ /api/email/accounts - Found ${accounts?.length || 0} accounts for user ${session.user.id}`);
    
    if (accounts && accounts.length > 0) {
      console.log('📧 /api/email/accounts - Accounts found:');
      accounts.forEach((acc, index) => {
        console.log(`   ${index + 1}. ${acc.email} (ID: ${acc.id})`);
      });
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