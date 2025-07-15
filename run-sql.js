// run-sql.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  try {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
      console.error('Please provide an SQL file path');
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log(`Running SQL from ${sqlFile}...`);
    
    // Split the SQL into statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}: ${stmt.substring(0, 50)}...`);
      
      try {
        // Use direct SQL query instead of RPC
        const { data, error } = await supabase.from('_sql').select('*').execute(stmt + ';');
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Exception executing statement ${i + 1}:`, err);
      }
    }
    
    console.log('SQL execution completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runSQL(); 