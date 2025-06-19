-- Create emails table that works with the existing schema
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  raw_content TEXT,
  analysis TEXT,
  contact_id TEXT REFERENCES contacts(id),
  message_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on contact_id for faster lookups
CREATE INDEX IF NOT EXISTS emails_contact_id_idx ON emails(contact_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS emails_created_at_idx ON emails(created_at);
