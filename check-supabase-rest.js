// check-supabase-rest.js
const fetch = require('node-fetch');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function checkConnection() {
  try {
    console.log('Checking Supabase connection using REST API...');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Key: ${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}`);
    
    // Try to list all tables
    console.log('Trying to list all tables...');
    
    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log('✅ REST API working');
      console.log('Available tables:', tables);
      
      // If tables exist, try to create our settings tables
      if (tables && Object.keys(tables).length > 0) {
        console.log('Trying to create user_preferences table...');
        
        const createTableResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            sql_string: `
              CREATE TABLE IF NOT EXISTS public.user_preferences (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                theme TEXT DEFAULT 'system',
                font_size TEXT DEFAULT 'medium',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
              );
            `
          })
        });
        
        if (createTableResponse.ok) {
          const result = await createTableResponse.json();
          console.log('✅ Table creation response:', result);
        } else {
          console.error('❌ Error creating table:', await createTableResponse.text());
        }
      }
    } else {
      console.error('❌ Error accessing REST API:', await tablesResponse.text());
    }
    
    console.log('Connection check completed');
  } catch (err) {
    console.error('Error checking connection:', err);
  }
}

checkConnection(); 