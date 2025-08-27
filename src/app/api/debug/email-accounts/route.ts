import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get all email accounts
    const { data: allEmailAccounts, error: emailAccountsError } = await supabase
      .from('email_accounts')
      .select(`
        *,
        users:user_id(id, email)
      `);

    if (emailAccountsError) {
      console.error('Error fetching email accounts:', emailAccountsError);
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 });
    }

    // Get email account table schema
    const { data: emailAccountSchema, error: schemaError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'email_accounts'
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    // Get RLS policies for email_accounts
    const { data: emailAccountPolicies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'email_accounts' });

    // Check if RLS is enabled on email_accounts
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'email_accounts' });

    // Get all email account errors from logs
    const { data: emailErrors, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .ilike('message', '%email%')
      .order('created_at', { ascending: false })
      .limit(50);

    // Check for Peter's account
    const peterEmail = 'peter@alpinegroup.si';
    const { data: peterUser } = await supabase.auth.admin.listUsers({
      email: peterEmail
    });

    let peterEmailAccounts = null;
    let peterEmailAccountsError = null;
    
    if (peterUser?.users && peterUser.users.length > 0) {
      const peterUserId = peterUser.users[0].id;
      
      const { data: accounts, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', peterUserId);
        
      peterEmailAccounts = accounts;
      peterEmailAccountsError = error;
    }

    return NextResponse.json({
      totalEmailAccounts: allEmailAccounts?.length || 0,
      emailAccounts: allEmailAccounts,
      emailAccountSchema,
      emailAccountPolicies,
      rlsEnabled,
      emailErrors,
      peter: {
        user: peterUser?.users?.[0] || null,
        emailAccounts: peterEmailAccounts,
        error: peterEmailAccountsError?.message
      },
      debug: {
        emailAccountsError: emailAccountsError?.message,
        schemaError: schemaError?.message,
        policiesError: policiesError?.message,
        rlsError: rlsError?.message,
        logsError: logsError?.message
      }
    });

  } catch (error) {
    console.error('Debug email accounts API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
