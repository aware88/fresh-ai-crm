#!/usr/bin/env node

/**
 * Direct verification and fix for RLS issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifyAndFixRLS() {
  console.log('🔍 Verifying and Fixing RLS Status...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const tables = [
    'email_content_cache',
    'email_index', 
    'email_threads',
    'emails',
    'email_accounts'
  ];

  console.log('📋 Checking RLS status for all email tables...');
  console.log('================================================================================\n');

  // First, let's check the current status
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT 
            '${tableName}' as table_name,
            rowsecurity as rls_enabled,
            (SELECT COUNT(*) FROM pg_policies WHERE tablename = '${tableName}' AND schemaname = 'public') as policy_count
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}';
        `
      });

      if (error) {
        console.log(`❌ ${tableName}: Error checking status - ${error.message}`);
      } else if (data && data[0]) {
        const status = data[0];
        const rlsStatus = status.rls_enabled ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`${rlsStatus} ${tableName} (${status.policy_count || 0} policies)`);
      } else {
        console.log(`⚠️  ${tableName}: Table not found`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  console.log('\n================================================================================');
  console.log('\n🔧 Applying comprehensive fix...\n');

  // Now apply the fix using a single comprehensive SQL command
  const fixSQL = `
    DO $$
    DECLARE
      tbl text;
      tables text[] := ARRAY['email_content_cache', 'email_index', 'email_threads', 'emails', 'email_accounts'];
    BEGIN
      FOREACH tbl IN ARRAY tables
      LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
          -- Enable RLS
          EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
          
          -- Drop all existing policies
          FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl)
          LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
          END LOOP;
          
          -- Create service role policy
          EXECUTE format('
            CREATE POLICY "service_role_all_%s" 
            ON public.%I 
            FOR ALL 
            TO service_role 
            USING (true) 
            WITH CHECK (true)', tbl, tbl);
          
          -- Block anon access
          EXECUTE format('
            CREATE POLICY "anon_block_%s" 
            ON public.%I 
            FOR ALL 
            TO anon 
            USING (false) 
            WITH CHECK (false)', tbl, tbl);
          
          -- Block authenticated access (we use NextAuth)
          EXECUTE format('
            CREATE POLICY "auth_block_%s" 
            ON public.%I 
            FOR ALL 
            TO authenticated 
            USING (false) 
            WITH CHECK (false)', tbl, tbl);
            
          RAISE NOTICE 'Fixed table: %', tbl;
        END IF;
      END LOOP;
    END $$;
  `;

  try {
    console.log('Executing comprehensive RLS fix...');
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: fixSQL
    });

    if (error) {
      console.error('❌ Error applying fix:', error.message);
    } else {
      console.log('✅ Fix applied successfully!');
    }
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  }

  console.log('\n================================================================================');
  console.log('\n📋 Final RLS status:\n');

  // Check final status
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT 
            '${tableName}' as table_name,
            rowsecurity as rls_enabled,
            (SELECT COUNT(*) FROM pg_policies WHERE tablename = '${tableName}' AND schemaname = 'public') as policy_count
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}';
        `
      });

      if (!error && data && data[0]) {
        const status = data[0];
        const rlsStatus = status.rls_enabled ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`${rlsStatus} ${tableName} (${status.policy_count || 0} policies)`);
      }
    } catch (err) {
      // Silent fail for final check
    }
  }

  console.log('\n✅ Process complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Check Supabase dashboard to verify RLS is enabled');
  console.log('  2. Restart your Next.js server');
  console.log('  3. Test email functionality in the app');
}

// Run the script
verifyAndFixRLS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
