-- Migration: Create Metakocka contact mappings table
-- Description: Creates a table to store mappings between CRM contacts and Metakocka contacts

BEGIN;

-- Create table for storing Metakocka contact mappings
CREATE TABLE IF NOT EXISTS metakocka_contact_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  metakocka_id VARCHAR(255) NOT NULL,
  metakocka_code VARCHAR(255),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'synced',
  sync_error TEXT,
  metadata JSONB,
  UNIQUE(contact_id, metakocka_id),
  CONSTRAINT organization_or_user_required CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_contact_id ON metakocka_contact_mappings(contact_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_metakocka_id ON metakocka_contact_mappings(metakocka_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_user_id ON metakocka_contact_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_organization_id ON metakocka_contact_mappings(organization_id);

-- Add RLS policies
ALTER TABLE metakocka_contact_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view mappings for their contacts or organization contacts
DROP POLICY IF EXISTS metakocka_contact_mappings_select_policy ON metakocka_contact_mappings;
CREATE POLICY metakocka_contact_mappings_select_policy ON metakocka_contact_mappings
  FOR SELECT USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can insert mappings for their contacts or organization contacts
DROP POLICY IF EXISTS metakocka_contact_mappings_insert_policy ON metakocka_contact_mappings;
CREATE POLICY metakocka_contact_mappings_insert_policy ON metakocka_contact_mappings
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can update mappings for their contacts or organization contacts
DROP POLICY IF EXISTS metakocka_contact_mappings_update_policy ON metakocka_contact_mappings;
CREATE POLICY metakocka_contact_mappings_update_policy ON metakocka_contact_mappings
  FOR UPDATE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can delete mappings for their contacts or organization contacts
DROP POLICY IF EXISTS metakocka_contact_mappings_delete_policy ON metakocka_contact_mappings;
CREATE POLICY metakocka_contact_mappings_delete_policy ON metakocka_contact_mappings
  FOR DELETE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Add comments
COMMENT ON TABLE metakocka_contact_mappings IS 'Stores mappings between CRM contacts and Metakocka contacts';

COMMIT;
