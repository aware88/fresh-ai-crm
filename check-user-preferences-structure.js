// Script to check the structure of the user_preferences table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Supabase URL and anon key are required.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  try {
    console.log('Checking user_preferences table structure...');
    
    // Query to get column information from PostgreSQL information schema
    const { data, error } = await supabase.rpc('get_table_columns', { 
      p_table_name: 'user_preferences',
      p_schema_name: 'public'
    });
    
    if (error) {
      console.error('Error fetching table structure using RPC:', error.message);
      
      // Alternative approach - try to select a row to see columns
      console.log('Trying alternative approach...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('user_preferences')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error querying table:', sampleError.message);
        
        // Last resort - query information schema directly
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_schema', 'public')
          .eq('table_name', 'user_preferences');
        
        if (columnsError) {
          console.error('Error querying information schema:', columnsError.message);
        } else {
          console.log('Columns in user_preferences table:');
          columns.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type})`);
          });
        }
      } else {
        console.log('Sample data:', sampleData);
        if (sampleData && sampleData.length > 0) {
          console.log('Columns in user_preferences table:', Object.keys(sampleData[0]));
        } else {
          console.log('Table exists but is empty.');
        }
      }
    } else {
      console.log('Columns in user_preferences table:');
      data.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTableStructure(); 