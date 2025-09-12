#!/usr/bin/env node

/**
 * Check RLS policies on email tables
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  try {
    console.log('🔒 Checking RLS policies...');
    
    // Check if RLS is enabled on email_index
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT schemaname, tablename, rowsecurity, hasrls 
          FROM pg_tables t
          JOIN pg_class c ON c.relname = t.tablename
          WHERE t.tablename IN ('email_index', 'email_content_cache', 'email_accounts')
          AND t.schemaname = 'public';
        `
      });

    if (rlsError) {
      console.log('❌ RLS check error:', rlsError);
      return;
    }

    console.log('📋 RLS Status:');
    rlsStatus?.forEach(table => {
      console.log(`  - ${table.tablename}: RLS ${table.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });

    // Check existing policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
          FROM pg_policies 
          WHERE tablename IN ('email_index', 'email_content_cache', 'email_accounts')
          ORDER BY tablename, policyname;
        `
      });

    if (policiesError) {
      console.log('❌ Policies check error:', policiesError);
      return;
    }

    console.log('\n📋 RLS Policies:');
    if (policies?.length > 0) {
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}.${policy.policyname} (${policy.cmd}): ${policy.qual || 'No condition'}`);
      });
    } else {
      console.log('  - No RLS policies found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies();