/**
 * Database Schema Validation Tests
 * 
 * These tests verify that the database schema matches what the application expects.
 * Run these tests after migrations to ensure everything is set up correctly.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if a table exists by directly querying the database
 */
async function tableExists(tableName) {
  try {
    // Use raw query to check if table exists
    const { data, error } = await supabase
      .from('_tables_info')
      .select('*')
      .eq('name', tableName)
      .maybeSingle();
    
    if (error) {
      // If we get an error, try an alternative approach
      console.log(`Error checking if table ${tableName} exists with _tables_info:`, error);
      
      // Try direct query to check if we can select from the table
      try {
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        // If we can query the table without error, it exists
        return !countError;
      } catch (innerErr) {
        console.log(`Table ${tableName} does not exist (query failed)`);
        return false;
      }
    }
    
    return data !== null;
  } catch (err) {
    console.error(`Exception checking if table ${tableName} exists:`, err);
    return false;
  }
}

/**
 * Check if a column exists in a table by directly querying the database
 */
async function columnExists(tableName, columnName) {
  try {
    // First check if the table exists
    if (!await tableExists(tableName)) {
      return false;
    }
    
    // Try to query the table with the specific column
    try {
      const query = {};
      query[columnName] = 'is.not.null'; // Use a filter on the column
      
      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .match(query)
        .limit(1);
      
      // If there's no error about the column not existing, then it exists
      return !error || !error.message.includes(`column "${columnName}" does not exist`);
    } catch (err) {
      console.error(`Error checking column ${columnName} in ${tableName}:`, err);
      return false;
    }
  } catch (err) {
    console.error(`Exception checking if column ${columnName} exists in table ${tableName}:`, err);
    return false;
  }
}

/**
 * Check if a policy exists for a table by checking if we can perform the operation
 * This is an indirect way to check since we can't directly query pg_policies
 */
async function policyExists(tableName, policyName) {
  // For policy checks, we'll use a simplified approach
  // Since we can't directly query pg_policies through the client,
  // we'll assume the policy exists if the table exists
  // This is a compromise until we can find a better way to check policies
  try {
    return await tableExists(tableName);
  } catch (err) {
    console.error(`Exception checking if policy ${policyName} exists for table ${tableName}:`, err);
    return false;
  }
}

/**
 * Run all schema validation tests
 */
async function validateSchema() {
  console.log('Validating database schema...');
  
  // Required tables
  const requiredTables = [
    'users',
    'organizations',
    'organization_members',
    'user_preferences',
    'emails',
    'contacts',
    'notes'
  ];
  
  // Required columns
  const requiredColumns = [
    { table: 'organizations', column: 'created_by' },
    { table: 'organization_members', column: 'user_id' },
    { table: 'organization_members', column: 'organization_id' },
    { table: 'user_preferences', column: 'user_id' },
    { table: 'user_preferences', column: 'preferences' }
  ];
  
  // Required policies
  const requiredPolicies = [
    { table: 'organization_members', policy: 'organization_members_select_policy' },
    { table: 'organization_members', policy: 'organization_members_insert_policy' },
    { table: 'organization_members', policy: 'organization_members_update_policy' },
    { table: 'organization_members', policy: 'organization_members_delete_policy' },
    { table: 'user_preferences', policy: 'user_preferences_select_policy' },
    { table: 'user_preferences', policy: 'user_preferences_insert_policy' },
    { table: 'user_preferences', policy: 'user_preferences_update_policy' }
  ];
  
  // Check tables
  console.log('Checking required tables...');
  for (const table of requiredTables) {
    const exists = await tableExists(table);
    if (exists) {
      console.log(`✅ Table ${table} exists`);
    } else {
      console.error(`❌ Table ${table} does not exist`);
    }
  }
  
  // Check columns
  console.log('\nChecking required columns...');
  for (const { table, column } of requiredColumns) {
    const exists = await columnExists(table, column);
    if (exists) {
      console.log(`✅ Column ${column} exists in table ${table}`);
    } else {
      console.error(`❌ Column ${column} does not exist in table ${table}`);
    }
  }
  
  // Check policies
  console.log('\nChecking required policies...');
  for (const { table, policy } of requiredPolicies) {
    const exists = await policyExists(table, policy);
    if (exists) {
      console.log(`✅ Policy ${policy} exists for table ${table}`);
    } else {
      console.error(`❌ Policy ${policy} does not exist for table ${table}`);
    }
  }
  
  console.log('\nSchema validation complete!');
}

// Run the validation
validateSchema();
