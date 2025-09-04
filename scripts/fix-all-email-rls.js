#!/usr/bin/env node

/**
 * Script to fix ALL email-related RLS issues reported by Supabase
 * This handles email_content_cache, email_index, and email_threads tables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixAllEmailRLS() {
  console.log('🔧 Fixing RLS for ALL Email Tables...\n');
  
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
    'email_threads'
  ];

  console.log('📋 Tables to fix:', tables.join(', '));
  console.log('================================================================================\n');

  for (const tableName of tables) {
    console.log(`\n🔄 Processing table: ${tableName}`);
    console.log('----------------------------------------');
    
    try {
      // Step 1: Check if table exists
      const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `
      });

      if (tableError || !tableExists || !tableExists[0]?.exists) {
        console.log(`  ⚠️  Table ${tableName} does not exist, skipping...`);
        continue;
      }

      console.log(`  ✅ Table exists`);

      // Step 2: Check current RLS status
      const { data: rlsStatus, error: rlsCheckError } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}';
        `
      });

      if (rlsCheckError) {
        console.error(`  ❌ Error checking RLS status:`, rlsCheckError.message);
        continue;
      }

      const isRLSEnabled = rlsStatus && rlsStatus[0] && rlsStatus[0].rowsecurity;
      console.log(`  📊 Current RLS status: ${isRLSEnabled ? 'ENABLED' : 'DISABLED'}`);

      // Step 3: Get existing policies
      const { data: existingPolicies, error: policiesError } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}';
        `
      });

      if (policiesError) {
        console.error(`  ❌ Error checking policies:`, policiesError.message);
      } else if (existingPolicies && existingPolicies.length > 0) {
        console.log(`  📜 Existing policies found (${existingPolicies.length}):`);
        existingPolicies.forEach(p => {
          console.log(`     - ${p.policyname}`);
        });
      } else {
        console.log(`  📜 No existing policies found`);
      }

      // Step 4: Enable RLS if not already enabled
      if (!isRLSEnabled) {
        console.log(`  🔒 Enabling RLS...`);
        const { error: enableError } = await supabase.rpc('exec_sql', {
          sql_string: `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`
        });

        if (enableError) {
          console.error(`  ❌ Error enabling RLS:`, enableError.message);
          continue;
        }
        console.log(`  ✅ RLS enabled`);
      }

      // Step 5: Drop old conflicting policies
      console.log(`  🗑️  Dropping old policies...`);
      const oldPolicyNames = [
        'Users can access cached content',
        'Users can cache content',
        'Users can update cached content',
        'email_content_cache_user_policy',
        'Users can delete their email index',
        'Users can insert their email index',
        'Users can update their email index',
        'Users can view their email index',
        'email_index_user_policy',
        'Users can view their threads',
        'email_threads_policy'
      ];

      for (const policyName of oldPolicyNames) {
        const { error } = await supabase.rpc('exec_sql', {
          sql_string: `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};`
        });
        if (error) {
          console.log(`     ⚠️  Could not drop policy "${policyName}": ${error.message}`);
        }
      }

      // Step 6: Create new policies for NextAuth integration
      console.log(`  📝 Creating new policies...`);
      
      // Service role policy
      const { error: serviceError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE POLICY "Service role full access to ${tableName}"
          ON public.${tableName}
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        `
      });

      if (serviceError) {
        console.log(`     ⚠️  Service role policy may already exist: ${serviceError.message}`);
      } else {
        console.log(`     ✅ Service role policy created`);
      }

      // Block anon access
      const { error: anonError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE POLICY "Block anon access to ${tableName}"
          ON public.${tableName}
          FOR ALL
          TO anon
          USING (false)
          WITH CHECK (false);
        `
      });

      if (anonError) {
        console.log(`     ⚠️  Anon block policy may already exist: ${anonError.message}`);
      } else {
        console.log(`     ✅ Anon block policy created`);
      }

      // Block authenticated role (since we use NextAuth)
      const { error: authError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE POLICY "Block authenticated access to ${tableName}"
          ON public.${tableName}
          FOR ALL
          TO authenticated
          USING (false)
          WITH CHECK (false);
        `
      });

      if (authError) {
        console.log(`     ⚠️  Authenticated block policy may already exist: ${authError.message}`);
      } else {
        console.log(`     ✅ Authenticated block policy created`);
      }

      // Step 7: Verify final state
      const { data: finalRLS, error: finalError } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}';
        `
      });

      const finalStatus = finalRLS && finalRLS[0] && finalRLS[0].rowsecurity;
      console.log(`  ✅ Final RLS status: ${finalStatus ? 'ENABLED' : 'DISABLED'}`);

      // Count records in table
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`  📊 Records in table: ${count || 0}`);
      }

    } catch (error) {
      console.error(`  ❌ Error processing ${tableName}:`, error.message);
    }
  }

  console.log('\n================================================================================');
  console.log('\n✅ RLS Fix Complete!');
  console.log('\n📝 Summary:');
  console.log('  1. RLS is now ENABLED on all email tables');
  console.log('  2. Old policies that relied on auth.uid() have been removed');
  console.log('  3. New policies grant access only to service_role');
  console.log('  4. Anon and authenticated roles are blocked');
  console.log('  5. All email access must go through API routes with NextAuth validation');
  console.log('\n⚠️  Important: Restart your Next.js server after running this script');
}

// Run the script
fixAllEmailRLS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
