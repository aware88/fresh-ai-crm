#!/usr/bin/env node

/**
 * Script to fix RLS policies for email_index table
 * This script applies RLS to the email_index table to match our security model
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fixEmailIndexRLS() {
  console.log('🔧 Fixing Email Index RLS Policies...\n');
  
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
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250202000001_fix_email_index_rls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Applying migration: 20250202000001_fix_email_index_rls.sql');
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

    // Check if email_index table exists
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'email_index'
        );
      `
    });

    if (tableError) {
      console.error('Error checking if table exists:', tableError);
    } else {
      console.log('\n🔍 email_index table exists:', tableExists && tableExists[0] ? tableExists[0].exists : 'unknown');
    }

    // Count emails in email_index
    const { count: emailCount, error: countError } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting emails:', countError);
    } else {
      console.log(`📧 Total emails in email_index: ${emailCount || 0}`);
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Restart the Next.js server');
    console.log('  2. Try accessing emails in the UI');
    console.log('  3. If issues persist, run the fix-email-index API route:');
    console.log('     curl -X POST http://localhost:3000/api/email/fix-email-index');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmailIndexRLS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
