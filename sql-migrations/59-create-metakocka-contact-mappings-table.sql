-- 59-create-metakocka-contact-mappings-table.sql
-- Creates a table to store mappings between CRM contacts and Metakocka partners
-- Run this in the Supabase SQL editor or include it in your CI migration pipeline.

BEGIN;

-- Create the metakocka_contact_mappings table
CREATE TABLE IF NOT EXISTS metakocka_contact_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL,
  metakocka_id TEXT NOT NULL,
  metakocka_code TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced',
  sync_error TEXT,
  metadata JSONB,
  
  -- Add a unique constraint to prevent duplicate mappings
  UNIQUE(user_id, contact_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_user_id ON metakocka_contact_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_contact_id ON metakocka_contact_mappings(contact_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_metakocka_id ON metakocka_contact_mappings(metakocka_id);

-- Add RLS policies
ALTER TABLE metakocka_contact_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only see their own mappings
CREATE POLICY select_metakocka_contact_mappings ON metakocka_contact_mappings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for insert: users can only insert their own mappings
CREATE POLICY insert_metakocka_contact_mappings ON metakocka_contact_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for update: users can only update their own mappings
CREATE POLICY update_metakocka_contact_mappings ON metakocka_contact_mappings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for delete: users can only delete their own mappings
CREATE POLICY delete_metakocka_contact_mappings ON metakocka_contact_mappings
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
