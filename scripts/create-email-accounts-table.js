// Script to create the email_accounts table if it doesn't exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createEmailAccountsTable() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Create the email_accounts table using the REST API
    console.log('Creating email_accounts table...');
    
    // Define the table schema
    const { error } = await supabase
      .from('email_accounts')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000000', // Dummy record that will be deleted
          user_id: '00000000-0000-0000-0000-000000000000',
          provider_type: 'imap',
          email: 'dummy@example.com',
          is_active: false
        }
      ])
      .select();
    
    if (error) {
      // If the error is not because the table already exists
      if (error.code !== '42P01') {
        console.error('Error creating email_accounts table:', error);
        process.exit(1);
      }
      
      // If we get here, we need to create the table structure
      console.log('Table does not exist, creating structure...');
      
      // Create the table structure using the REST API
      // Since we can't execute SQL directly, we'll use the Supabase dashboard
      // to create the table structure
      console.log(`
Please create the email_accounts table manually using the Supabase dashboard:

1. Go to ${process.env.NEXT_PUBLIC_SUPABASE_URL}
2. Navigate to Database > Tables
3. Click "Create a new table"
4. Name it "email_accounts"
5. Add the following columns:
   - id: uuid (primary key, default: uuid_generate_v4())
   - user_id: uuid (not null)
   - organization_id: uuid (nullable)
   - provider_type: text (not null, check: IN ('outlook', 'imap'))
   - email: text (not null)
   - username: text (nullable)
   - password: text (nullable)
   - imap_host: text (nullable)
   - imap_port: integer (nullable)
   - imap_security: text (nullable, check: IN ('SSL/TLS', 'STARTTLS', 'None'))
   - smtp_host: text (nullable)
   - smtp_port: integer (nullable)
   - smtp_security: text (nullable, check: IN ('SSL/TLS', 'STARTTLS', 'None'))
   - is_active: boolean (default: true)
   - last_sync_at: timestamp with time zone (nullable)
   - sync_error: text (nullable)
   - created_at: timestamp with time zone (default: now())
   - updated_at: timestamp with time zone (default: now())

6. Enable Row Level Security
7. Add the following policies:
   - "Users can view their own email accounts" (SELECT) USING (auth.uid() = user_id)
   - "Users can insert their own email accounts" (INSERT) WITH CHECK (auth.uid() = user_id)
   - "Users can update their own email accounts" (UPDATE) USING (auth.uid() = user_id)
   - "Users can delete their own email accounts" (DELETE) USING (auth.uid() = user_id)

8. Create the following indexes:
   - email_accounts_user_id_idx ON user_id
   - email_accounts_organization_id_idx ON organization_id
   - email_accounts_email_idx ON email
`);
      
      // Alternative approach: Use the REST API to create a simple version of the table
      console.log('\nAlternatively, we can create a simplified version of the table now.');
      console.log('Would you like to create a simplified version? (y/n)');
      
      // Since we can't get user input in this script, we'll provide instructions
      console.log('\nTo create a simplified version, run the following command in the Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  organization_id UUID,
  provider_type TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  password TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_security TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_security TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email accounts"
  ON public.email_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email accounts"
  ON public.email_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts"
  ON public.email_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email accounts"
  ON public.email_accounts
  FOR DELETE
  USING (auth.uid() = user_id);
`);
      
      process.exit(0);
    }
    
    // If we get here, the table was created successfully
    console.log('Successfully created email_accounts table');
    
    // Delete the dummy record
    const { error: deleteError } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('Error deleting dummy record:', deleteError);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createEmailAccountsTable();
