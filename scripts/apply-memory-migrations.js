/**
 * Apply Memory Migrations Script
 * 
 * This script applies the memory-related SQL migrations using the Supabase client.
 * It reads the SQL files and executes them directly against the database.
 * 
 * Usage:
 * node scripts/apply-memory-migrations.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configure Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Supabase URL and service role key are required');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files to apply
const migrationFiles = [
  'src/lib/ai/memory/migrations/20250706_agent_memory_config.sql',
  'src/lib/ai/memory/migrations/20250707_agent_memory_stats.sql'
];

// Apply migrations
async function applyMigrations() {
  console.log('🚀 Applying memory migrations...');
  
  for (const migrationFile of migrationFiles) {
    try {
      console.log(`\n📄 Processing migration: ${migrationFile}`);
      
      // Read migration file
      const filePath = path.join(process.cwd(), migrationFile);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute SQL
      console.log('⚙️ Executing SQL...');
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Error applying migration ${migrationFile}:`);
        console.error(error);
        process.exit(1);
      }
      
      console.log(`✅ Successfully applied migration: ${migrationFile}`);
    } catch (error) {
      console.error(`❌ Error processing migration ${migrationFile}:`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 All migrations applied successfully!');
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql function if it doesn\'t exist...');
  
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { 
    sql: createFunctionSql 
  }).catch(() => {
    // If the function doesn't exist yet, create it directly
    return supabase.from('_exec_sql_temp').rpc('exec_sql_direct', {
      sql: createFunctionSql
    });
  });
  
  if (error) {
    console.log('Creating exec_sql function directly...');
    // Try direct SQL execution as a fallback
    const { error: directError } = await supabase.from('_dummy').select('*').limit(1).then(
      async () => {
        return await supabase.from('_dummy').rpc('exec_sql_direct', {
          sql: createFunctionSql
        });
      }
    );
    
    if (directError) {
      console.error('❌ Failed to create exec_sql function:');
      console.error(directError);
      console.error('\nPlease run the migrations manually using the Supabase dashboard SQL editor.');
      process.exit(1);
    }
  }
  
  console.log('✅ exec_sql function is ready');
}

// Main function
async function main() {
  try {
    await createExecSqlFunction();
    await applyMigrations();
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
