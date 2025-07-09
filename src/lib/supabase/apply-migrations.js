/**
 * Database Migration Script for CRM Mind
 * 
 * This script applies SQL migrations to the Supabase database.
 * It reads SQL files from the migrations directory and executes them.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration directory path
const migrationsDir = path.join(__dirname, 'migrations');

/**
 * Apply a single SQL migration file
 * @param {string} filePath - Path to the SQL file
 * @returns {Promise<void>}
 */
async function applySqlMigration(filePath) {
  try {
    console.log(`Applying migration: ${path.basename(filePath)}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    try {
      // First try using the exec_sql RPC function
      const { error } = await supabase.rpc('exec_sql', { sql_string: sqlContent });
      
      if (error) {
        console.error(`Error applying migration ${filePath} via RPC:`, error);
        throw error;
      }
      
      console.log(`Successfully applied migration: ${path.basename(filePath)}`);
    } catch (rpcError) {
      // If exec_sql function doesn't exist or fails, try creating it and retry
      if (rpcError.message && (rpcError.message.includes('function "exec_sql" does not exist') || 
          rpcError.message.includes('function exec_sql') || 
          rpcError.code === '42883')) {
        console.log('Creating exec_sql function and retrying...');
        await createExecSqlFunction();
        
        // Retry with the newly created function
        const { error: retryError } = await supabase.rpc('exec_sql', { sql_string: sqlContent });
        
        if (retryError) {
          console.error(`Error applying migration ${filePath} after retry:`, retryError);
          throw retryError;
        }
        
        console.log(`Successfully applied migration after retry: ${path.basename(filePath)}`);
      } else {
        // Try alternative methods if available
        if (typeof supabase.sql === 'function') {
          console.log('Attempting to apply migration via supabase.sql...');
          const { error: sqlError } = await supabase.sql(sqlContent);
          
          if (sqlError) {
            console.error(`Error applying migration ${filePath} via supabase.sql:`, sqlError);
            throw sqlError;
          }
          
          console.log(`Successfully applied migration via supabase.sql: ${path.basename(filePath)}`);
        } else {
          // No other method available, rethrow the original error
          throw rpcError;
        }
      }
    }
  } catch (err) {
    console.error(`Failed to apply migration ${filePath}:`, err);
    throw err;
  }
}

/**
 * Create the exec_sql function if it doesn't exist
 * @returns {Promise<void>}
 */
async function createExecSqlFunction() {
  const createFunctionSql = `
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

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
  `;
  
  try {
    console.log('Attempting to create exec_sql function via REST API...');
    
    // Try to use the REST API to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_string: createFunctionSql })
    });
    
    if (response.ok) {
      console.log('Successfully created exec_sql function via REST API');
      return;
    }
    
    // If that fails, try using the Supabase SQL method if available
    if (typeof supabase.sql === 'function') {
      console.log('Attempting to create exec_sql function via supabase.sql...');
      const { error } = await supabase.sql(createFunctionSql);
      
      if (!error) {
        console.log('Successfully created exec_sql function via supabase.sql');
        return;
      }
    }
    
    // As a last resort, try using the pg module directly
    console.log('Attempting to create exec_sql function via pg module...');
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: `${supabaseUrl.replace('https://', 'postgres://')}:${supabaseServiceKey}@db.${supabaseUrl.replace('https://', '')}/postgres`
    });
    
    await pool.query(createFunctionSql);
    await pool.end();
    console.log('Successfully created exec_sql function via pg module');
  } catch (err) {
    console.error('Failed to create exec_sql function:', err);
    throw new Error('Could not create exec_sql function');
  }
}

/**
 * Apply all migrations in a directory
 * @param {string} dirPath - Path to the migrations directory
 * @returns {Promise<void>}
 */
async function applyMigrationsInDirectory(dirPath) {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist. Skipping.`);
      return;
    }
    
    const items = fs.readdirSync(dirPath);
    
    // Sort directories to ensure migrations are applied in order
    const sortedItems = items.sort();
    
    for (const item of sortedItems) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Process SQL files in the subdirectory
        const sqlFiles = fs.readdirSync(itemPath)
          .filter(file => file.endsWith('.sql'))
          .sort(); // Sort to ensure consistent order
        
        for (const sqlFile of sqlFiles) {
          await applySqlMigration(path.join(itemPath, sqlFile));
        }
      } else if (stats.isFile() && item.endsWith('.sql')) {
        // Process SQL file directly in the migrations directory
        await applySqlMigration(itemPath);
      }
    }
  } catch (err) {
    console.error(`Error applying migrations in ${dirPath}:`, err);
    throw err;
  }
}

/**
 * Main function to run migrations
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Apply migrations
    await applyMigrationsInDirectory(migrationsDir);
    
    console.log('All migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
