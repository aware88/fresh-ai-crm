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

    // Get RLS policies for key tables
    const tables = [
      'email_accounts',
      'emails',
      'organization_members',
      'organizations',
      'user_preferences',
      'profiles',
      'contacts',
      'products',
      'suppliers'
    ];

    const results = {};

    for (const table of tables) {
      // Check if table exists
      const { data: tableExists, error: tableError } = await supabase
        .rpc('check_table_exists', { table_name: table });

      if (tableError) {
        console.error(`Error checking if table ${table} exists:`, tableError);
        results[table] = { error: tableError.message };
        continue;
      }

      if (!tableExists) {
        results[table] = { exists: false };
        continue;
      }

      // Get RLS policies for table
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies_for_table', { table_name: table });

      if (policiesError) {
        console.error(`Error getting policies for table ${table}:`, policiesError);
        results[table] = { error: policiesError.message };
        continue;
      }

      // Check if RLS is enabled
      const { data: rlsEnabled, error: rlsError } = await supabase
        .rpc('check_rls_enabled', { table_name: table });

      if (rlsError) {
        console.error(`Error checking RLS for table ${table}:`, rlsError);
        results[table] = { 
          policies,
          error: rlsError.message 
        };
        continue;
      }

      results[table] = {
        exists: true,
        rlsEnabled,
        policies
      };
    }

    return NextResponse.json({
      results,
      currentUser: session.user
    });

  } catch (error) {
    console.error('Debug RLS policies API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
