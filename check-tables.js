// check-tables.js
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

async function checkTableExists(tableName) {
  try {
    // Use RPC to check if table exists
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `
    });
    
    if (error) {
      console.error(`Error checking if ${tableName} exists:`, error);
      return false;
    }
    
    return data && data[0] && data[0].exists;
  } catch (err) {
    console.error(`Error in checkTableExists for ${tableName}:`, err);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('Checking if tables were created...');
    
    // Check user_preferences table
    const userPrefsExists = await checkTableExists('user_preferences');
    console.log(userPrefsExists ? '✅ user_preferences table exists' : '❌ user_preferences table does not exist');
    
    // Check display_preferences table
    const displayPrefsExists = await checkTableExists('display_preferences');
    console.log(displayPrefsExists ? '✅ display_preferences table exists' : '❌ display_preferences table does not exist');
    
    // Check notification_templates table
    const templatesExists = await checkTableExists('notification_templates');
    console.log(templatesExists ? '✅ notification_templates table exists' : '❌ notification_templates table does not exist');
    
    if (templatesExists) {
      // Count templates
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: `SELECT COUNT(*) FROM notification_templates;`
      });
      
      if (!error && data && data[0]) {
        console.log(`   Template count: ${data[0].count}`);
      }
    }
    
    // Check notification_preferences table
    const notifPrefsExists = await checkTableExists('notification_preferences');
    console.log(notifPrefsExists ? '✅ notification_preferences table exists' : '❌ notification_preferences table does not exist');
    
    console.log('Table check completed');
  } catch (err) {
    console.error('Error checking tables:', err);
  }
}

checkTables(); 