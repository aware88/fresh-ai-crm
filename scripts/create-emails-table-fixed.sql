-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  raw_content TEXT,
  analysis TEXT,
  contact_id UUID REFERENCES contacts(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own emails
CREATE POLICY emails_select_policy ON emails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own emails
CREATE POLICY emails_insert_policy ON emails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own emails
CREATE POLICY emails_update_policy ON emails
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own emails
CREATE POLICY emails_delete_policy ON emails
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on contact_id for faster lookups
CREATE INDEX IF NOT EXISTS emails_contact_id_idx ON emails(contact_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS emails_user_id_idx ON emails(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS emails_created_at_idx ON emails(created_at);
