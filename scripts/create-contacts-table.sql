-- SQL script to create the contacts table in Supabase
-- You can run this directly in the Supabase SQL Editor

-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  personalityType TEXT,
  notes TEXT,
  lastContact TIMESTAMP WITH TIME ZONE,
  lastInteraction TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts (email);

-- Create index on company for potential filtering/grouping
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts (company);

-- Create index on personalityType for AI features
CREATE INDEX IF NOT EXISTS contacts_personality_idx ON contacts (personalityType);

-- Add RLS (Row Level Security) policy if needed
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Example policy to allow authenticated users to see all contacts
-- CREATE POLICY "Allow authenticated users to see all contacts" ON contacts
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Example policy to allow users to update only their own contacts
-- CREATE POLICY "Allow users to update their own contacts" ON contacts
--   FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users if needed
-- GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

-- Add a comment to the table for documentation
COMMENT ON TABLE contacts IS 'Stores contact information for the Fresh AI CRM system';
