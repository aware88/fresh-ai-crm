// Script to check the actual schema of the contacts table in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return;
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Query the information schema to get column information
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying contacts table:', error);
      return;
    }
    
    // If we have data, log the first row to see the column names
    if (data && data.length > 0) {
      console.log('Contacts table schema:');
      console.log(Object.keys(data[0]));
      console.log('\nSample data:');
      console.log(data[0]);
    } else {
      console.log('No data found in contacts table');
      
      // Try to insert a test row to see if it works
      console.log('Attempting to insert a test row...');
      const { data: insertData, error: insertError } = await supabase
        .from('contacts')
        .insert([
          { 
            first_name: 'Test', 
            last_name: 'User',
            email: 'test.schema@example.com'
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        console.log('Insert successful:', insertData);
      }
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

// Run the function
checkSchema();
