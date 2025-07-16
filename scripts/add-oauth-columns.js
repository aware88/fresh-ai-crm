const { createClient } = require('@supabase/supabase-js');

async function addOAuthColumns() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Adding OAuth columns to email_accounts table...');
    
    // Use the RPC function to execute SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add OAuth columns to email_accounts table
        ALTER TABLE email_accounts 
        ADD COLUMN IF NOT EXISTS access_token TEXT,
        ADD COLUMN IF NOT EXISTS refresh_token TEXT,
        ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
        
        -- Add display_name column if it doesn't exist
        ALTER TABLE email_accounts 
        ADD COLUMN IF NOT EXISTS display_name TEXT;
        
        -- Add an index on token_expires_at for efficient token expiration queries
        CREATE INDEX IF NOT EXISTS email_accounts_token_expires_at_idx 
        ON email_accounts (token_expires_at) 
        WHERE token_expires_at IS NOT NULL;
        
        -- Update the updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- Create trigger if it doesn't exist
        DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON email_accounts;
        CREATE TRIGGER update_email_accounts_updated_at 
            BEFORE UPDATE ON email_accounts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (error) {
      console.error('Error adding OAuth columns:', error);
      
      // If exec_sql doesn't work, try using the HTTP API directly
      console.log('Trying alternative approach...');
      
      // Check if the table exists first
      const { data: tableData, error: tableError } = await supabase
        .from('email_accounts')
        .select('*')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === '42P01') {
          console.error('email_accounts table does not exist. Please create it first.');
          process.exit(1);
        } else {
          console.error('Error checking table:', tableError);
          process.exit(1);
        }
      }
      
      console.log('Table exists, columns may already be present or require manual addition.');
      console.log('Please run this SQL in your Supabase dashboard:');
      console.log(`
        ALTER TABLE email_accounts 
        ADD COLUMN IF NOT EXISTS access_token TEXT,
        ADD COLUMN IF NOT EXISTS refresh_token TEXT,
        ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS display_name TEXT;
        
        CREATE INDEX IF NOT EXISTS email_accounts_token_expires_at_idx 
        ON email_accounts (token_expires_at) 
        WHERE token_expires_at IS NOT NULL;
      `);
      
      process.exit(1);
    }
    
    console.log('Successfully added OAuth columns to email_accounts table');
    console.log('The following columns were added:');
    console.log('- access_token (TEXT)');
    console.log('- refresh_token (TEXT)'); 
    console.log('- token_expires_at (TIMESTAMP WITH TIME ZONE)');
    console.log('- display_name (TEXT)');
    console.log('- Index on token_expires_at for performance');
    
    console.log('\nOAuth tokens will now be stored securely in the database.');
    
  } catch (error) {
    console.error('Exception adding OAuth columns:', error);
    process.exit(1);
  }
}

// Run the script
addOAuthColumns(); 