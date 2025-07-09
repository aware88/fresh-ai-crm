/**
 * Database Migration Script for CRM Mind
 * 
 * This script applies SQL migrations to the Supabase database.
 * It reads SQL files from the migrations directory and executes them.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Supabase Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to execute SQL statements one by one
async function executeSql(sql) {
  // Split SQL into individual statements (naive approach, but works for simple cases)
  const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    try {
      // Execute each statement using the from().rpc() approach
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // If the exec_sql function doesn't exist, we need to create it first
        if (error.message && error.message.includes('function "exec_sql" does not exist')) {
          console.log('Creating exec_sql function...');
          await createExecSqlFunction();
          // Retry the statement
          const { retryError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (retryError) {
            console.error('Error executing SQL after creating exec_sql function:', retryError);
            return false;
          }
        } else {
          console.error('Error executing SQL:', error);
          return false;
        }
      }
    } catch (err) {
      console.error('Exception executing SQL:', err);
      return false;
    }
  }
  
  return true;
}

// Create the exec_sql function
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    // We need to use a direct query to create the function
    // This is a bit of a hack, but it works for Supabase
    const { data, error } = await supabase
      .from('_dummy_query_to_create_function')
      .select()
      .limit(1)
      .then(async () => {
        // Now try to execute our create function SQL using a raw query
        // This is using undocumented functionality that might change
        return await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: createFunctionSql
          })
        }).then(res => res.json());
      });
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      return false;
    }
    
    console.log('Successfully created exec_sql function');
    return true;
  } catch (err) {
    console.error('Exception creating exec_sql function:', err);
    return false;
  }
}

// Apply the user_preferences migration
async function applyUserPreferencesMigration() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'src/lib/supabase/migrations/20250706_user_preferences/user_preferences.sql'), 
    'utf8'
  );
  
  console.log('Applying user_preferences migration...');
  
  const success = await executeSql(sql);
  if (success) {
    console.log('✅ Successfully applied user_preferences migration');
  } else {
    console.error('❌ Failed to apply user_preferences migration');
  }
  return success;
}

// Apply the organization_members policy fix
async function applyOrgMembersPolicyFix() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'src/lib/supabase/migrations/20250706_fix_organization_members_policy/fix_organization_members_policy.sql'), 
    'utf8'
  );
  
  console.log('Applying organization_members policy fix...');
  
  const success = await executeSql(sql);
  if (success) {
    console.log('✅ Successfully applied organization_members policy fix');
  } else {
    console.error('❌ Failed to apply organization_members policy fix');
  }
  return success;
}

// Main function to run migrations
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Apply user_preferences migration
    const userPrefsSuccess = await applyUserPreferencesMigration();
    
    // Apply organization_members policy fix
    const orgMembersPolicySuccess = await applyOrgMembersPolicyFix();
    
    if (userPrefsSuccess && orgMembersPolicySuccess) {
      console.log('All migrations completed successfully! 🎉');
    } else {
      console.log('Some migrations failed. Check the logs above for details.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
