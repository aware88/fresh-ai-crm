import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * API route to fix email_index table access after RLS changes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
    console.log('🔧 Fixing email_index table access for user:', session.user.id);
    
    // Step 1: Check if email_index table has RLS enabled
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'email_index';
      `
    });

    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
      return NextResponse.json({ error: 'Failed to check RLS status' }, { status: 500 });
    }

    // Step 2: Enable RLS on email_index if not already enabled
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql_string: `
        ALTER TABLE public.email_index ENABLE ROW LEVEL SECURITY;
      `
    });

    if (enableError) {
      console.error('Error enabling RLS:', enableError);
      return NextResponse.json({ error: 'Failed to enable RLS' }, { status: 500 });
    }

    // Step 3: Drop existing policies
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_string: `
        DROP POLICY IF EXISTS "Service role can manage email_index" ON public.email_index;
        DROP POLICY IF EXISTS "Block anon access to email_index" ON public.email_index;
        DROP POLICY IF EXISTS "Block authenticated role access to email_index" ON public.email_index;
      `
    });

    if (dropError) {
      console.error('Error dropping policies:', dropError);
      return NextResponse.json({ error: 'Failed to drop policies' }, { status: 500 });
    }

    // Step 4: Create new policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Service role has full access
        CREATE POLICY "Service role can manage email_index"
        ON public.email_index
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        -- Block anon access
        CREATE POLICY "Block anon access to email_index"
        ON public.email_index
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false);

        -- Block authenticated role access (since we use NextAuth, not Supabase Auth)
        CREATE POLICY "Block authenticated role access to email_index"
        ON public.email_index
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false);
      `
    });

    if (policyError) {
      console.error('Error creating policies:', policyError);
      return NextResponse.json({ error: 'Failed to create policies' }, { status: 500 });
    }

    // Step 5: Verify the user has access to their emails
    const { data: emailCount, error: countError } = await supabase
      .from('email_index')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (countError) {
      console.error('Error counting emails:', countError);
      return NextResponse.json({ error: 'Failed to count emails' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email index access fixed',
      emailCount: emailCount?.count || 0
    });
    
  } catch (error) {
    console.error('Error fixing email index access:', error);
    return NextResponse.json({
      error: 'Failed to fix email index access',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
