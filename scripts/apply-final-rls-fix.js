#!/usr/bin/env node

/**
 * Final RLS fix - applies the migration directly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyFinalRLSFix() {
  console.log('🚀 Applying FINAL RLS Fix for All Email Tables...\n');
  
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

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250202000002_enable_rls_all_email_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration: 20250202000002_enable_rls_all_email_tables.sql');
    console.log('================================================================================\n');

    // Split into individual statements and execute each one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^--.*$/));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip pure comment lines
      if (statement.startsWith('--')) continue;
      
      // Get a description of the statement
      let description = '';
      if (statement.includes('ALTER TABLE')) {
        const match = statement.match(/ALTER TABLE public\.(\w+)/);
        description = `Enable RLS on ${match ? match[1] : 'table'}`;
      } else if (statement.includes('DROP POLICY')) {
        const match = statement.match(/DROP POLICY IF EXISTS "([^"]+)"/);
        description = `Drop policy: ${match ? match[1] : 'policy'}`;
      } else if (statement.includes('CREATE POLICY')) {
        const match = statement.match(/CREATE POLICY "([^"]+)"/);
        description = `Create policy: ${match ? match[1] : 'policy'}`;
      } else if (statement.includes('COMMENT ON')) {
        description = 'Add comment';
      } else {
        description = statement.substring(0, 50) + '...';
      }
      
      process.stdout.write(`  [${i+1}/${statements.length}] ${description}... `);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_string: statement + ';'
        });

        if (error) {
          console.log('❌');
          errors.push({ statement: description, error: error.message });
          errorCount++;
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log('❌');
        errors.push({ statement: description, error: err.message });
        errorCount++;
      }
    }

    console.log('\n================================================================================');
    console.log(`\n📊 Results:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(e => {
        console.log(`  - ${e.statement}: ${e.error}`);
      });
    }

    // Verify final state
    console.log('\n🔍 Verifying final RLS status...\n');
    
    const tables = ['email_content_cache', 'email_index', 'email_threads', 'emails', 'email_accounts'];
    
    for (const tableName of tables) {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT 
            rowsecurity,
            (SELECT COUNT(*) FROM pg_policies WHERE tablename = '${tableName}' AND schemaname = 'public') as policy_count
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = '${tableName}';
        `
      });

      if (!error && data && data[0]) {
        const rlsEnabled = data[0].rowsecurity;
        const policyCount = data[0].policy_count || 0;
        const status = rlsEnabled ? '✅' : '❌';
        console.log(`  ${status} ${tableName}: RLS ${rlsEnabled ? 'ENABLED' : 'DISABLED'} (${policyCount} policies)`);
      } else {
        console.log(`  ⚠️  ${tableName}: Could not verify`);
      }
    }

    console.log('\n✅ Migration process complete!');
    console.log('\n📝 IMPORTANT - Manual Steps Required:');
    console.log('\n1. Go to Supabase Dashboard: ' + supabaseUrl);
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this query to verify:');
    console.log('\n```sql');
    console.log(`SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE p.tablename = t.tablename) as policies
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('email_content_cache', 'email_index', 'email_threads', 'emails', 'email_accounts')
ORDER BY tablename;`);
    console.log('```');
    console.log('\n4. If any tables show rls_enabled = false, run:');
    console.log('\n```sql');
    console.log('ALTER TABLE public.email_content_cache ENABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE public.email_index ENABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;');
    console.log('```');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
applyFinalRLSFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
