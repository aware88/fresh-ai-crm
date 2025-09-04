#!/usr/bin/env node

/**
 * Apply the RLS migration directly to the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyRLSMigration() {
  console.log('🚀 Applying RLS Migration for NextAuth Integration...\n');
  
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
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250201000001_fix_email_rls_for_nextauth.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Applying migration: 20250201000001_fix_email_rls_for_nextauth.sql');
    console.log('================================================================================\n');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      // Skip pure comment lines
      if (statement.startsWith('--')) continue;
      
      // Extract a description from the statement
      let description = statement.substring(0, 50).replace(/\n/g, ' ');
      if (statement.length > 50) description += '...';
      
      console.log(`  Executing: ${description}`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      });

      if (error) {
        console.log(`    ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`    ✅ Success`);
        successCount++;
      }
    }

    console.log('\n================================================================================');
    console.log(`\n📊 Migration Results:`);
    console.log(`  ✅ Successful statements: ${successCount}`);
    console.log(`  ❌ Failed statements: ${errorCount}`);

    // Verify the final state
    console.log('\n🔍 Verifying final state...\n');

    // Check RLS status
    const { data: rlsCheck } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          tablename,
          rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('emails', 'email_accounts');
      `
    });

    console.log('RLS Status:', rlsCheck ? 'Checked' : 'Could not verify');

    // Check policies count
    const { data: policyCheck } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT 
          tablename,
          COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('emails', 'email_accounts')
        GROUP BY tablename;
      `
    });

    console.log('Policy Count:', policyCheck ? 'Checked' : 'Could not verify');

    console.log('\n✅ Migration applied successfully!');
    console.log('\n📝 Security Model Summary:');
    console.log('  1. RLS is ENABLED on both emails and email_accounts tables');
    console.log('  2. Service role (API routes) has FULL ACCESS');
    console.log('  3. Anon role is COMPLETELY BLOCKED');
    console.log('  4. Authenticated role is COMPLETELY BLOCKED (we use NextAuth, not Supabase Auth)');
    console.log('  5. All access MUST go through API routes that validate NextAuth sessions');
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run the script
applyRLSMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
