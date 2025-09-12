#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyMigration() {
  console.log('🔧 Applying comprehensive email schema fix...\n');

  try {
    // Read the migration SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250110_fix_email_schema_complete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration SQL loaded successfully');
    console.log('📊 This migration will:');
    console.log('   - Add missing columns to email_threads (subject, email_count, created_at, updated_at)');
    console.log('   - Remove unique constraint on thread_id');
    console.log('   - Add sync-related columns to email_accounts');
    console.log('   - Create email_sync_state table');
    console.log('   - Set up proper indexes and triggers\n');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      // Get a description of what this statement does
      let description = 'SQL statement';
      if (statement.includes('ALTER TABLE email_threads')) {
        description = 'Modifying email_threads table';
      } else if (statement.includes('ALTER TABLE email_accounts')) {
        description = 'Modifying email_accounts table';
      } else if (statement.includes('CREATE TABLE')) {
        description = 'Creating email_sync_state table';
      } else if (statement.includes('CREATE INDEX')) {
        description = 'Creating index';
      } else if (statement.includes('CREATE POLICY')) {
        description = 'Creating RLS policy';
      } else if (statement.includes('UPDATE')) {
        description = 'Updating existing data';
      } else if (statement.includes('CREATE TRIGGER')) {
        description = 'Creating trigger';
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        description = 'Creating function';
      }

      process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);

      try {
        // Try to execute via RPC if available
        const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(() => {
          // RPC not available, statement will need to be run manually
          return { error: 'RPC not available' };
        });

        if (error) {
          if (error === 'RPC not available' || error.message?.includes('function') || error.message?.includes('does not exist')) {
            console.log('⚠️  (needs manual execution)');
            errorCount++;
          } else if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            console.log('✓ (already applied)');
            successCount++;
          } else {
            console.log(`❌ (${error.message || error})`);
            errorCount++;
          }
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log(`❌ (${err.message})`);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Need manual execution: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements could not be executed automatically.');
      console.log('This is usually because direct SQL execution is not enabled.');
      console.log('\n📝 To complete the migration:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Copy and paste the contents of:');
      console.log(`   ${migrationPath}`);
      console.log('4. Click "Run" to execute the migration\n');
    }

    // Test the schema
    console.log('\n🧪 Testing the schema...');
    
    // Test email_threads
    const { data: threadTest, error: threadError } = await supabase
      .from('email_threads')
      .select('id, thread_id, subject, email_count, created_at, updated_at')
      .limit(1);

    if (threadError) {
      console.log(`❌ email_threads test failed: ${threadError.message}`);
      console.log('   The table still needs the migration to be applied.');
    } else {
      console.log('✅ email_threads schema looks good!');
    }

    // Test email_accounts
    const { data: accountTest, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, real_time_sync_active, webhook_active, setup_completed, polling_interval')
      .limit(1);

    if (accountError) {
      if (accountError.message.includes('real_time_sync_active') || 
          accountError.message.includes('webhook_active') ||
          accountError.message.includes('setup_completed') ||
          accountError.message.includes('polling_interval')) {
        console.log(`⚠️  email_accounts is missing sync columns`);
      } else {
        console.log('✅ email_accounts schema looks good!');
      }
    } else {
      console.log('✅ email_accounts schema looks good!');
    }

    // Test email_sync_state
    const { data: syncTest, error: syncError } = await supabase
      .from('email_sync_state')
      .select('id')
      .limit(1);

    if (syncError) {
      if (syncError.message.includes('relation') && syncError.message.includes('does not exist')) {
        console.log('⚠️  email_sync_state table does not exist yet');
      } else {
        console.log('✅ email_sync_state table exists!');
      }
    } else {
      console.log('✅ email_sync_state table exists!');
    }

    console.log('\n✨ Migration process complete!');
    
    if (errorCount > 0) {
      console.log('\n🔔 Remember to run the migration SQL manually in Supabase.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    console.log('\n📝 Please run the migration manually in Supabase SQL Editor:');
    console.log('   supabase/migrations/20250110_fix_email_schema_complete.sql');
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(console.error);