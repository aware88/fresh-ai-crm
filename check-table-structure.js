// Script to check the notification_templates table structure
const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase URL and anon key
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
    console.log('Checking notification_templates table structure...');
    
    // Use system schema query to get column information
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'notification_templates' });
    
    if (error) {
      console.error('Error fetching table structure:', error);
      
      // Try an alternative approach - query the table directly
      console.log('Trying alternative approach...');
      const { data: tableData, error: tableError } = await supabase
        .from('notification_templates')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Error querying table:', tableError);
      } else {
        console.log('Table exists. Sample data:', tableData);
        if (tableData && tableData.length > 0) {
          console.log('Columns in the table:', Object.keys(tableData[0]));
        } else {
          console.log('Table exists but is empty.');
        }
      }
    } else {
      console.log('Table structure:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTableStructure(); 