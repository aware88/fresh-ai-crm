/**
 * Database Migration System for CRM Mind
 * 
 * This script provides a simple migration system for Supabase database changes.
 * It tracks applied migrations and only runs new ones.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration directory path
const migrationsDir = path.join(__dirname, 'migrations');

/**
 * Ensure the migrations tracking table exists
 */
async function ensureMigrationsTable() {
  console.log('Ensuring migrations table exists...');
  
  try {
    // First, check if the exec_sql function exists
    const { data: functionData, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'exec_sql')
      .limit(1);
    
    // If exec_sql function doesn't exist, create it first
    if (functionError || !functionData || functionData.length === 0) {
      console.log('Creating exec_sql function...');
      
      // Create the exec_sql function directly using the REST API
      const execSqlFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result JSONB;
        BEGIN
          EXECUTE sql_string INTO result;
          RETURN result;
        EXCEPTION WHEN OTHERS THEN
          RETURN jsonb_build_array(
            jsonb_build_object(
              'error', SQLERRM,
              'detail', SQLSTATE
            )
          );
        END;
        $$;
        
        GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
      `;
      
      // Execute the SQL directly using the REST API
      let createFunctionError;
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: execSqlFunctionSQL });
        createFunctionError = error;
      } catch (err) {
        createFunctionError = err;
      }
      
      if (createFunctionError) {
        console.log('Could not create exec_sql function, trying alternative method...');
        // Try an alternative method using raw SQL
        let altError;
        try {
          const { error } = await supabase.auth.admin.executeSql(execSqlFunctionSQL);
          altError = error;
        } catch (err) {
          altError = err;
        }
        
        if (altError) {
          console.log('Warning: Could not create exec_sql function. Will try to continue anyway.');
        } else {
          console.log('✅ Created exec_sql function using alternative method');
        }
      } else {
        console.log('✅ Created exec_sql function');
      }
    }
    
    // Try to select from the migrations table to see if it exists
    const { data, error } = await supabase
      .from('migrations')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') { // Table doesn't exist
      // Create the migrations table using the exec_sql function
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      
      let createError;
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: createTableSQL });
        createError = error;
      } catch (err) {
        createError = err;
      }
      
      if (createError) {
        throw new Error(`Failed to create migrations table: ${JSON.stringify(createError)}`);
      }
      
      console.log('✅ Created migrations table');
    } else {
      console.log('✅ Migrations table already exists');
    }
  } catch (err) {
    console.error('Failed to ensure migrations table:', err);
    throw err;
  }
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations() {
  try {
    const { data, error } = await supabase
      .from('migrations')
      .select('name')
      .order('applied_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data.map(row => row.name);
  } catch (err) {
    console.error('Failed to get applied migrations:', err);
    throw err;
  }
}

/**
 * Record a migration as applied
 */
async function recordMigration(name) {
  try {
    const { error } = await supabase
      .from('migrations')
      .insert({ name });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Recorded migration: ${name}`);
  } catch (err) {
    console.error(`Failed to record migration ${name}:`, err);
    throw err;
  }
}

/**
 * Execute SQL statements
 */
async function executeSql(sql) {
  try {
    // Execute SQL using the exec_sql function
    let error;
    try {
      const { data, error: err } = await supabase.rpc('exec_sql', { sql_string: sql });
      error = err;
    } catch (err) {
      error = err;
    }
    
    if (error) {
      // Try alternative method if exec_sql fails
      console.log('Using alternative SQL execution method...');
      try {
        // Try to use the raw SQL execution method if available
        if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.executeSql === 'function') {
          let altError;
          try {
            const { error } = await supabase.auth.admin.executeSql(sql);
            altError = error;
          } catch (err) {
            altError = err;
          }
          if (altError) {
            throw new Error(`Failed to execute SQL with alternative method: ${JSON.stringify(altError)}`);
          }
        } else {
          throw new Error('No alternative SQL execution method available');
        }
      } catch (altErr) {
        console.error('Alternative SQL execution failed:', altErr);
        throw new Error(`Failed to execute SQL: ${JSON.stringify(error)}. Alternative method also failed.`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Failed to execute SQL:', err);
    throw err;
  }
}

/**
 * Apply a migration
 */
async function applyMigration(migrationDir) {
  const migrationName = path.basename(migrationDir);
  console.log(`Applying migration: ${migrationName}`);
  
  // Find SQL files in the migration directory
  const sqlFiles = fs.readdirSync(migrationDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure consistent order
  
  if (sqlFiles.length === 0) {
    console.warn(`⚠️ No SQL files found in ${migrationName}`);
    return false;
  }
  
  // Apply each SQL file
  for (const sqlFile of sqlFiles) {
    const sqlPath = path.join(migrationDir, sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`  Executing ${sqlFile}...`);
    const success = await executeSql(sql);
    
    if (!success) {
      console.error(`❌ Failed to apply ${sqlFile} in ${migrationName}`);
      return false;
    }
  }
  
  // Record the migration
  await recordMigration(migrationName);
  console.log(`✅ Successfully applied migration: ${migrationName}`);
  return true;
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`Found ${appliedMigrations.length} previously applied migrations`);
    
    // Get list of available migrations
    const availableMigrations = fs.readdirSync(migrationsDir)
      .filter(item => {
        const itemPath = path.join(migrationsDir, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .sort(); // Sort to ensure consistent order
    
    console.log(`Found ${availableMigrations.length} available migrations`);
    
    // Determine pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !appliedMigrations.includes(migration)
    );
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of pendingMigrations) {
      const migrationDir = path.join(migrationsDir, migration);
      const success = await applyMigration(migrationDir);
      
      if (success) {
        appliedCount++;
      } else {
        console.error(`❌ Failed to apply migration: ${migration}`);
        process.exit(1);
      }
    }
    
    console.log(`✅ Successfully applied ${appliedCount} migrations`);
    
    if (appliedCount === 0) {
      console.log('No pending migrations to apply');
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
