// check-supabase-connection.js
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

async function checkConnection() {
  try {
    console.log('Checking Supabase connection...');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Key: ${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}`);
    
    // Try to get the current user
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error getting session:', authError);
    } else {
      console.log('✅ Authentication API working');
      console.log('Session:', authData);
    }
    
    // Try to access a table that should exist
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('Error accessing users table:', userError);
      
      // Try to list all tables
      console.log('Trying to list all tables...');
      const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
        sql_string: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });
      
      if (tablesError) {
        console.error('Error listing tables:', tablesError);
      } else {
        console.log('Available tables:', tablesData);
      }
    } else {
      console.log('✅ Database access working');
      console.log('Users:', userData);
    }
    
    // Try to execute a simple SQL query
    const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
      sql_string: 'SELECT NOW() as current_time;'
    });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
    } else {
      console.log('✅ SQL execution working');
      console.log('SQL result:', sqlData);
    }
    
    console.log('Connection check completed');
  } catch (err) {
    console.error('Error checking connection:', err);
  }
}

checkConnection(); 