-- Migration: Create Metakocka integration logs table
-- Description: Creates a table to store integration logs for Metakocka operations

BEGIN;

-- Create table for storing Metakocka integration logs
CREATE TABLE IF NOT EXISTS metakocka_integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'contact', 'sales_document', etc.
  entity_id UUID NOT NULL,
  operation VARCHAR(50) NOT NULL, -- 'sync_to_metakocka', 'sync_from_metakocka', 'delete', etc.
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'warning'
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  organization_id UUID,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_user_id ON metakocka_integration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_entity_type_entity_id ON metakocka_integration_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_status ON metakocka_integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_created_at ON metakocka_integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_tags ON metakocka_integration_logs USING GIN (tags);

-- Add RLS policies
ALTER TABLE metakocka_integration_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY metakocka_integration_logs_select_policy ON metakocka_integration_logs
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own logs
CREATE POLICY metakocka_integration_logs_insert_policy ON metakocka_integration_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own logs
CREATE POLICY metakocka_integration_logs_update_policy ON metakocka_integration_logs
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own logs
CREATE POLICY metakocka_integration_logs_delete_policy ON metakocka_integration_logs
  FOR DELETE USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE metakocka_integration_logs IS 'Stores integration logs for Metakocka operations';

COMMIT;
