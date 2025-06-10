-- SQL script to create the interactions table in Supabase
-- You can run this directly in the Supabase SQL Editor

-- Create interactions table to store email and other interaction history
CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'call', 'meeting', etc.
  subject TEXT,
  content TEXT,
  sentiment TEXT, -- AI-analyzed sentiment
  personalityInsights TEXT, -- JSON field for AI analysis
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on contact_id for faster lookups
CREATE INDEX IF NOT EXISTS interactions_contact_id_idx ON interactions (contact_id);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS interactions_type_idx ON interactions (type);

-- Create index on date for chronological sorting
CREATE INDEX IF NOT EXISTS interactions_date_idx ON interactions (date);

-- Add RLS (Row Level Security) policy if needed
-- ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Add a comment to the table for documentation
COMMENT ON TABLE interactions IS 'Stores interaction history with contacts for the Fresh AI CRM system';
