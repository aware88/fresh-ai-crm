-- Migration: Create Metakocka credentials table
-- Description: Creates a table to store Metakocka API credentials with organization support

BEGIN;

-- Create table for storing Metakocka credentials
CREATE TABLE IF NOT EXISTS metakocka_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_id VARCHAR(255) NOT NULL,
  secret_key TEXT NOT NULL,
  api_endpoint VARCHAR(255) DEFAULT 'https://main.metakocka.si/rest/v1',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'not_synced',
  sync_error TEXT,
  metadata JSONB,
  UNIQUE(organization_id, company_id),
  CONSTRAINT organization_or_user_required CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_metakocka_credentials_organization_id ON metakocka_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_credentials_user_id ON metakocka_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_credentials_company_id ON metakocka_credentials(company_id);

-- Add RLS policies
ALTER TABLE metakocka_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view credentials for their organizations
CREATE POLICY metakocka_credentials_select_policy ON metakocka_credentials
  FOR SELECT USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can insert credentials for their organizations
CREATE POLICY metakocka_credentials_insert_policy ON metakocka_credentials
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND (role = 'admin' OR is_owner = TRUE)
    ))
  );

-- Policy: Users can update credentials for their organizations
CREATE POLICY metakocka_credentials_update_policy ON metakocka_credentials
  FOR UPDATE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND (role = 'admin' OR is_owner = TRUE)
    ))
  );

-- Policy: Users can delete credentials for their organizations
CREATE POLICY metakocka_credentials_delete_policy ON metakocka_credentials
  FOR DELETE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND (role = 'admin' OR is_owner = TRUE)
    ))
  );

-- Add comments
COMMENT ON TABLE metakocka_credentials IS 'Stores Metakocka API credentials with organization support';

COMMIT;
