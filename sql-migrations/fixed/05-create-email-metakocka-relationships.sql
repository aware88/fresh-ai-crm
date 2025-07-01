-- Migration: Create email-Metakocka relationships table
-- Description: Creates a table to store relationships between emails and Metakocka entities

BEGIN;

-- Create table for storing email-Metakocka relationships
CREATE TABLE IF NOT EXISTS email_metakocka_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES supplier_emails(id) ON DELETE CASCADE,
  metakocka_entity_type VARCHAR(50) NOT NULL, -- 'contact', 'product', 'sales_document'
  metakocka_entity_id VARCHAR(255) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL, -- 'mentioned', 'primary', 'related'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB,
  organization_id UUID,
  UNIQUE(email_id, metakocka_entity_type, metakocka_entity_id)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_metakocka_relationships_email_id ON email_metakocka_relationships(email_id);
CREATE INDEX IF NOT EXISTS idx_email_metakocka_relationships_metakocka_entity ON email_metakocka_relationships(metakocka_entity_type, metakocka_entity_id);
CREATE INDEX IF NOT EXISTS idx_email_metakocka_relationships_user_id ON email_metakocka_relationships(user_id);

-- Add RLS policies
ALTER TABLE email_metakocka_relationships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view relationships for their emails
CREATE POLICY email_metakocka_relationships_select_policy ON email_metakocka_relationships
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert relationships for their emails
CREATE POLICY email_metakocka_relationships_insert_policy ON email_metakocka_relationships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update relationships for their emails
CREATE POLICY email_metakocka_relationships_update_policy ON email_metakocka_relationships
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete relationships for their emails
CREATE POLICY email_metakocka_relationships_delete_policy ON email_metakocka_relationships
  FOR DELETE USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE email_metakocka_relationships IS 'Stores relationships between emails and Metakocka entities';

COMMIT;
