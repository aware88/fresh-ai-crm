-- Create the email_accounts table to store both OAuth and IMAP email account credentials for CRM Mind
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('outlook', 'gmail', 'imap')),
  
  -- OAuth specific fields
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- IMAP specific fields
  password_encrypted TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  smtp_host TEXT,
  smtp_port INTEGER,
  use_tls BOOLEAN DEFAULT TRUE,
  
  -- Common fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own email accounts
CREATE POLICY email_accounts_select_policy ON email_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own email accounts
CREATE POLICY email_accounts_insert_policy ON email_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own email accounts
CREATE POLICY email_accounts_update_policy ON email_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own email accounts
CREATE POLICY email_accounts_delete_policy ON email_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS email_accounts_user_id_idx ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS email_accounts_email_idx ON email_accounts(email);
CREATE INDEX IF NOT EXISTS email_accounts_provider_type_idx ON email_accounts(provider_type);

-- Create function to update the updated_at timestamp for CRM Mind email accounts
CREATE OR REPLACE FUNCTION update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_email_accounts_updated_at
BEFORE UPDATE ON email_accounts
FOR EACH ROW
EXECUTE FUNCTION update_email_accounts_updated_at();
