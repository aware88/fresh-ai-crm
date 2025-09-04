#!/usr/bin/env node

/**
 * Direct database script to fix RLS policies for email tables
 * This connects directly to Supabase using service role credentials
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixEmailRLSDirect() {
  console.log('🔧 Fixing Email RLS Policies (Direct Database Connection)...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Check current RLS status
    console.log('\n📊 Checking current RLS status...');
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

    if (statusError) {
      console.error('Error checking RLS status:', statusError);
    } else {
      console.log('Current RLS status:', rlsStatus);
    }

    // Step 2: Drop all existing policies
    console.log('\n🗑️  Dropping existing policies...');
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
          DROP POLICY IF EXISTS "Service role can manage emails" ON public.emails;
          DROP POLICY IF EXISTS "Anon cannot access emails" ON public.emails;
          
          -- Drop all existing policies on email_accounts table
          DROP POLICY IF EXISTS "Users can only view their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Users can only insert their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Users can only update their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Users can only delete their own email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Service role can manage email accounts" ON public.email_accounts;
          DROP POLICY IF EXISTS "Anon cannot access email accounts" ON public.email_accounts;
        END $$;
      `
    });

    if (dropError) {
      console.error('Error dropping policies:', dropError);
    } else {
      console.log('✅ Existing policies dropped');
    }

    // Step 3: Enable RLS
    console.log('\n🔒 Enabling RLS on tables...');
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Enable RLS on tables
        ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
      `
    });

    if (enableError) {
      console.error('Error enabling RLS:', enableError);
    } else {
      console.log('✅ RLS enabled on both tables');
    }

    // Step 4: Create new policies for NextAuth integration
    console.log('\n📝 Creating new policies for NextAuth integration...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Service role policies (for API routes with NextAuth validation)
        CREATE POLICY "Service role can manage email accounts"
        ON public.email_accounts
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        CREATE POLICY "Service role can manage emails"
        ON public.emails
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        -- Block anon access completely
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
    } else {
      console.log('✅ New policies created');
    }

    // Step 5: Verify the policies
    console.log('\n✅ Verifying policies...');
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
    } else {
      console.log('\n📋 Active policies:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.tablename}: ${policy.policyname}`);
          console.log(`    Roles: ${policy.roles}, Command: ${policy.cmd}`);
        });
      }
    }

    console.log('\n✅ RLS policies have been successfully configured!');
    console.log('\n⚠️  Important Notes:');
    console.log('1. RLS is now enabled on emails and email_accounts tables');
    console.log('2. Service role (used by API routes) has full access');
    console.log('3. Anonymous access is completely blocked');
    console.log('4. All email access must go through authenticated API routes');
    console.log('5. API routes must validate NextAuth sessions before accessing data');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmailRLSDirect().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
