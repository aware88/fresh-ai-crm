-- Migration: Create Metakocka product mappings table
-- Description: Creates a table to store mappings between CRM products and Metakocka products

BEGIN;

-- Create table for storing Metakocka product mappings
CREATE TABLE IF NOT EXISTS metakocka_product_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  metakocka_id VARCHAR(255) NOT NULL,
  metakocka_code VARCHAR(255),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'synced',
  sync_error TEXT,
  metadata JSONB,
  organization_id UUID REFERENCES organizations(id),
  UNIQUE(product_id, metakocka_id)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_product_id ON metakocka_product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_metakocka_id ON metakocka_product_mappings(metakocka_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_user_id ON metakocka_product_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_organization_id ON metakocka_product_mappings(organization_id);

-- Add RLS policies
ALTER TABLE metakocka_product_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view mappings for their products
CREATE POLICY metakocka_product_mappings_select_policy ON metakocka_product_mappings
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can insert mappings for their products
CREATE POLICY metakocka_product_mappings_insert_policy ON metakocka_product_mappings
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can update mappings for their products
CREATE POLICY metakocka_product_mappings_update_policy ON metakocka_product_mappings
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy: Users can delete mappings for their products
CREATE POLICY metakocka_product_mappings_delete_policy ON metakocka_product_mappings
  FOR DELETE USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Add comments
COMMENT ON TABLE metakocka_product_mappings IS 'Stores mappings between CRM products and Metakocka products';

COMMIT;
