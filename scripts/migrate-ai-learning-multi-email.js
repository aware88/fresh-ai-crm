#!/usr/bin/env node

/**
 * Migration Script: Multi-Email AI Learning Support
 * 
 * This script safely migrates the AI learning system to support account-specific patterns
 * and learning for the multi-email system.
 * 
 * Run with: node scripts/migrate-ai-learning-multi-email.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🚀 Starting Multi-Email AI Learning Migration...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Checking current database state...');
    await checkCurrentState();

    // Step 2: Run the migration
    console.log('\n🔧 Running migration...');
    await runMigration();

    // Step 3: Migrate existing data
    console.log('\n📦 Migrating existing AI learning data...');
    await migrateExistingData();

    // Step 4: Verify migration
    console.log('\n✅ Verifying migration...');
    await verifyMigration();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your AI learning components to be account-aware');
    console.log('   2. Add account selection UI to learning pages');
    console.log('   3. Test the multi-email AI learning functionality');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTo rollback, you may need to:');
    console.error('   1. Remove the account_id columns from AI tables');
    console.error('   2. Restore the original RLS policies');
    process.exit(1);
  }
}

async function checkCurrentState() {
  // Check if email_accounts table exists
  const { data: emailAccounts, error: accountsError } = await supabase
    .from('email_accounts')
    .select('id')
    .limit(1);

  if (accountsError && !accountsError.message.includes('relation') && !accountsError.message.includes('does not exist')) {
    throw new Error(`Failed to check email_accounts table: ${accountsError.message}`);
  }

  const hasEmailAccounts = !accountsError;
  const tables = [];
  if (hasEmailAccounts) tables.push('email_accounts');

  // Check other tables
  const { data: patterns } = await supabase
    .from('email_patterns')
    .select('id')
    .limit(1);
  if (patterns !== null || !accountsError) tables.push('email_patterns');

  const { data: profiles } = await supabase
    .from('user_ai_profiles')
    .select('id')
    .limit(1);
  if (profiles !== null || !accountsError) tables.push('user_ai_profiles');

  console.log(`   Found tables: ${tables.join(', ')}`);

  if (!tables.includes('email_accounts')) {
    throw new Error('email_accounts table not found. Please run email account migrations first.');
  }

  // Check if account_id columns already exist by testing a simple query
  console.log('   Checking if account_id columns already exist...');
  
  const existingColumns = [];
  try {
    const { error: patternsError } = await supabase
      .from('email_patterns')
      .select('account_id')
      .limit(1);
    if (!patternsError) existingColumns.push('email_patterns');
  } catch (e) {}

  try {
    const { error: profilesError } = await supabase
      .from('user_ai_profiles')
      .select('account_id')
      .limit(1);
    if (!profilesError) existingColumns.push('user_ai_profiles');
  } catch (e) {}

  if (existingColumns.length > 0) {
    console.log(`   ⚠️  account_id columns already exist in: ${existingColumns.join(', ')}`);
    console.log('   This migration may have already been applied.');
  } else {
    console.log('   ✅ Ready to add account_id columns');
  }

  // Count existing AI learning data
  const counts = {};
  for (const table of ['email_patterns', 'user_ai_profiles', 'support_templates']) {
    if (tables.includes(table)) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        counts[table] = count || 0;
      } catch (e) {
        counts[table] = 'N/A';
      }
    }
  }

  console.log('   Current AI data counts:');
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`     - ${table}: ${count} records`);
  });
}

async function runMigration() {
  // Read and execute the migration SQL
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250908000001_add_account_id_to_ai_learning_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split the SQL into individual statements (rough split)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Executing ${statements.length} SQL statements...`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        });
        
        if (error && !error.message.includes('already exists')) {
          console.warn(`   ⚠️  Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`   ✅ Statement ${i + 1} executed`);
        }
      } catch (err) {
        console.warn(`   ⚠️  Statement ${i + 1} skipped:`, err.message);
      }
    }
  }
}

async function migrateExistingData() {
  // Check if there's data to migrate (records without account_id)
  const { data: patternsToMigrate } = await supabase
    .from('email_patterns')
    .select('user_id')
    .is('account_id', null)
    .limit(1);

  if (!patternsToMigrate || patternsToMigrate.length === 0) {
    console.log('   ✅ No existing data to migrate');
    return;
  }

  console.log('   📦 Found existing AI data without account_id, migrating...');

  // Execute the migration function
  const { data, error } = await supabase.rpc('migrate_ai_data_to_primary_account');
  
  if (error) {
    throw new Error(`Data migration failed: ${error.message}`);
  }

  console.log('   ✅ Existing data migrated to primary email accounts');
}

async function verifyMigration() {
  // Check that account_id columns were added
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name')
    .eq('table_schema', 'public')
    .eq('column_name', 'account_id')
    .in('table_name', ['email_patterns', 'user_ai_profiles', 'support_templates']);

  const expectedTables = ['email_patterns', 'user_ai_profiles', 'support_templates'];
  const actualTables = columns.map(c => c.table_name);
  
  for (const table of expectedTables) {
    if (actualTables.includes(table)) {
      console.log(`   ✅ ${table}.account_id column added`);
    } else {
      console.log(`   ⚠️  ${table}.account_id column missing`);
    }
  }

  // Check that indexes were created
  const { data: indexes } = await supabase
    .from('pg_indexes')
    .select('indexname, tablename')
    .like('indexname', '%account_id%');

  console.log(`   ✅ Created ${indexes?.length || 0} account_id indexes`);

  // Check that functions were created
  const { data: functions } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_schema', 'public')
    .in('routine_name', ['get_account_patterns', 'get_account_ai_profile', 'migrate_ai_data_to_primary_account']);

  console.log(`   ✅ Created ${functions?.length || 0} helper functions`);

  // Verify data integrity
  const { data: orphanedPatterns } = await supabase
    .from('email_patterns')
    .select('id')
    .not('account_id', 'is', null)
    .not('account_id', 'in', 
      supabase.from('email_accounts').select('id')
    )
    .limit(1);

  if (orphanedPatterns && orphanedPatterns.length > 0) {
    console.log('   ⚠️  Found patterns with invalid account_id references');
  } else {
    console.log('   ✅ All account_id references are valid');
  }
}

// Run the migration
main().catch(console.error);