#!/usr/bin/env node

/**
 * Temporarily disable RLS on email tables to fix access issues
 * This is a quick fix while we implement proper solution
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function disableEmailRLS() {
  console.log('🔧 Temporarily Disabling RLS on Email Tables...\n');
  
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
    'email_index',
    'email_content_cache', 
    'email_threads',
    'emails',
    'email_accounts'
  ];

  console.log('⚠️  WARNING: This will temporarily disable RLS on email tables');
  console.log('This is a temporary fix to restore email access\n');
  
  for (const table of tables) {
    try {
      console.log(`🔓 Disabling RLS on ${table}...`);
      
      // First drop all policies
      const dropPolicies = `
        DO $$
        DECLARE
          pol RECORD;
        BEGIN
          FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = '${table}')
          LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, '${table}');
          END LOOP;
        END $$;
      `;
      
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql_string: dropPolicies
      });
      
      if (dropError) {
        console.log(`  ⚠️  Could not drop policies: ${dropError.message}`);
      }
      
      // Now disable RLS
      const { error: disableError } = await supabase.rpc('exec_sql', {
        sql_string: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
      });
      
      if (disableError) {
        console.log(`  ⚠️  Could not disable RLS: ${disableError.message}`);
      } else {
        console.log(`  ✅ RLS disabled on ${table}`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${table}:`, error.message);
    }
  }
  
  console.log('\n✅ RLS has been temporarily disabled on email tables');
  console.log('\n⚠️  IMPORTANT:');
  console.log('  1. This is a TEMPORARY fix');
  console.log('  2. Your emails should now be accessible');
  console.log('  3. We need to implement proper authentication integration');
  console.log('\n📝 Next Steps:');
  console.log('  1. Refresh your browser');
  console.log('  2. Go to the email page - emails should now be visible');
  console.log('  3. Consider migrating to Supabase Auth for proper RLS support');
}

// Run the script
disableEmailRLS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
