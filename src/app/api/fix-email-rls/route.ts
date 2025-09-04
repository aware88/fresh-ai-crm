import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Step 1: Check current RLS status
    const { data: rlsStatus, error: statusError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          tablename,
          rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('emails', 'email_accounts');
      `
    });

    console.log('Current RLS status:', rlsStatus);

    // Step 2: Drop all existing policies on emails table
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_string: `
        DO $$
        BEGIN
          -- Drop all existing policies on emails table
          DROP POLICY IF EXISTS "Users can only view emails from their accounts" ON public.emails;
          DROP POLICY IF EXISTS "Users can only insert emails to their accounts" ON public.emails;
          DROP POLICY IF EXISTS "Users can only update emails from their accounts" ON public.emails;
          DROP POLICY IF EXISTS "Users can only delete emails from their accounts" ON public.emails;
          DROP POLICY IF EXISTS "Users can view their own emails" ON public.emails;
          DROP POLICY IF EXISTS "Users can insert their own emails" ON public.emails;
          DROP POLICY IF EXISTS "Users can update their own emails" ON public.emails;
          DROP POLICY IF EXISTS "Users can delete their own emails" ON public.emails;
          
          -- Drop all existing policies on email_accounts table
          DROP POLICY IF EXISTS "Users can only view their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Users can only insert their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Users can only update their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Users can only delete their own email accounts" ON public.email_accounts;
        END $$;
      `
    });

    if (dropError) {
      console.error('Error dropping policies:', dropError);
    }

    // Step 3: Since we're using NextAuth, we need a different approach
    // We'll create a function that validates access based on the user_id passed from the app
    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create or replace a function to check email access
        CREATE OR REPLACE FUNCTION public.check_email_access(check_user_id uuid, account_id uuid)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Check if the user owns the email account
          RETURN EXISTS (
            SELECT 1 
            FROM public.email_accounts 
            WHERE id = account_id 
            AND user_id = check_user_id
          );
        END;
        $$;

        -- Create or replace a function to get user's email accounts
        CREATE OR REPLACE FUNCTION public.get_user_email_accounts(check_user_id uuid)
        RETURNS SETOF uuid
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT id 
          FROM public.email_accounts 
          WHERE user_id = check_user_id;
        END;
        $$;
      `
    });

    if (funcError) {
      console.error('Error creating functions:', funcError);
      return NextResponse.json({ 
        error: 'Failed to create helper functions', 
        details: funcError.message 
      }, { status: 500 });
    }

    // Step 4: Enable RLS on tables
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Enable RLS on tables
        ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
      `
    });

    if (enableError) {
      console.error('Error enabling RLS:', enableError);
    }

    // Step 5: Create new RLS policies that work with NextAuth
    // Since auth.uid() won't work with NextAuth, we'll use a different approach
    // We'll pass the user_id from the application layer and validate it
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- For now, we'll create permissive policies that allow authenticated access
        -- The actual security will be enforced at the API level using NextAuth sessions
        
        -- Email accounts policies
        CREATE POLICY "Service role can manage email accounts"
        ON public.email_accounts
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        -- Emails policies  
        CREATE POLICY "Service role can manage emails"
        ON public.emails
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        -- Create read-only policies for anon role (if needed for public endpoints)
        CREATE POLICY "Anon cannot access email accounts"
        ON public.email_accounts
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false);

        CREATE POLICY "Anon cannot access emails"
        ON public.emails
        FOR ALL
        TO anon
        USING (false)
        WITH CHECK (false);
      `
    });

    if (policyError) {
      console.error('Error creating policies:', policyError);
      return NextResponse.json({ 
        error: 'Failed to create policies', 
        details: policyError.message 
      }, { status: 500 });
    }

    // Step 6: Verify the policies were created
    const { data: policies, error: verifyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('emails', 'email_accounts')
        ORDER BY tablename, policyname;
      `
    });

    if (verifyError) {
      console.error('Error verifying policies:', verifyError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'RLS policies configured for NextAuth integration',
      policies: policies,
      note: 'Security is enforced at the API level using NextAuth sessions. All API routes must validate session.user.id before accessing email data.'
    });

  } catch (error) {
    console.error('Error fixing RLS policies:', error);
    return NextResponse.json({ 
      error: 'Failed to fix RLS policies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get current policies
    const { data: policies, error } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('emails', 'email_accounts')
        ORDER BY tablename, policyname;
      `
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get RLS status
    const { data: rlsStatus, error: statusError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          tablename,
          rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('emails', 'email_accounts');
      `
    });

    return NextResponse.json({ 
      policies,
      rlsStatus,
      note: 'Current RLS configuration for email tables'
    });

  } catch (error) {
    console.error('Error getting RLS status:', error);
    return NextResponse.json({ 
      error: 'Failed to get RLS status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
