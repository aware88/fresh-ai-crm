// run-settings-tables.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function runSqlFile(filePath) {
  try {
    console.log(`Running SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute SQL using exec_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error(`Error executing SQL from ${filePath}:`, error);
      return false;
    }
    
    console.log(`Successfully executed SQL from ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error running SQL file ${filePath}:`, err);
    return false;
  }
}

async function runSettingsTables() {
  try {
    // Run the settings tables SQL file
    await runSqlFile('settings-tables-fixed.sql');
  } catch (err) {
    console.error('Error:', err);
  }
}

runSettingsTables(); 