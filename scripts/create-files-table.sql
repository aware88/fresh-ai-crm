-- SQL script to create the files table in Supabase
-- You can run this directly in the Supabase SQL Editor

-- Create files table to store uploaded files metadata
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on contact_id for faster lookups
CREATE INDEX IF NOT EXISTS files_contact_id_idx ON files (contact_id);

-- Create index on content_type for filtering by file type
CREATE INDEX IF NOT EXISTS files_content_type_idx ON files (content_type);

-- Add RLS (Row Level Security) policy if needed
-- ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Add a comment to the table for documentation
COMMENT ON TABLE files IS 'Stores metadata for files uploaded to the CRM MIND system';

-- Enable Storage if not already enabled
-- This requires admin privileges and is typically done through the Supabase dashboard
-- But you can run this if you have the necessary permissions
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- Create a storage bucket for files if needed
-- This can also be done through the Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('crm-files', 'CRM Files', false)
-- ON CONFLICT DO NOTHING;
