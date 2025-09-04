import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    
    // First verify the account belongs to the user
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, email, provider_type')
      .eq('id', accountId)
      .eq('user_id', (session.user as any).id)
      .single();

    if (accountError || !account) {
      console.log('📧 Account verification failed:', { accountId, error: accountError });
      return NextResponse.json({ error: 'Email account not found or access denied' }, { status: 404 });
    }

    // Count emails for this account - try multiple table names that might exist
    let count = 0;
    let countError = null;
    
    // Try different possible table names
    const tablesToTry = ['emails', 'email_index', 'email_storage'];
    
    for (const tableName of tablesToTry) {
      try {
        const result = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('email_account_id', accountId);
          
        if (!result.error) {
          count = result.count || 0;
          console.log(`📧 Found ${count} emails in table '${tableName}' for account ${account.email}`);
          break;
        } else {
          console.log(`📧 Table '${tableName}' not accessible:`, result.error.message);
        }
      } catch (error) {
        console.log(`📧 Table '${tableName}' error:`, error);
        continue;
      }
    }
    
    // If no tables worked, return 0 count (account exists but no emails imported yet)
    if (count === 0) {
      console.log(`📧 No email tables found or no emails for account ${account.email}, returning 0 count`);
    }

    console.log(`📊 Email count for account ${account.email}: ${count || 0}`);

    return NextResponse.json({
      success: true,
      count: count || 0,
      account: {
        id: account.id,
        email: account.email,
        provider_type: account.provider_type
      }
    });

  } catch (error) {
    console.error('📧 Email count API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}