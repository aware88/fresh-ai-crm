-- Migration: Add tags to Metakocka error logs
-- Description: Adds organization_id reference to the Metakocka error logs table

BEGIN;

-- Add organization_id foreign key reference
ALTER TABLE metakocka_integration_logs
  ADD CONSTRAINT fk_metakocka_integration_logs_organization
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id);

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_organization_id 
  ON metakocka_integration_logs(organization_id);

-- Update RLS policies to include organization check
DROP POLICY IF EXISTS metakocka_integration_logs_select_policy ON metakocka_integration_logs;
CREATE POLICY metakocka_integration_logs_select_policy ON metakocka_integration_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS metakocka_integration_logs_insert_policy ON metakocka_integration_logs;
CREATE POLICY metakocka_integration_logs_insert_policy ON metakocka_integration_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS metakocka_integration_logs_update_policy ON metakocka_integration_logs;
CREATE POLICY metakocka_integration_logs_update_policy ON metakocka_integration_logs
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS metakocka_integration_logs_delete_policy ON metakocka_integration_logs;
CREATE POLICY metakocka_integration_logs_delete_policy ON metakocka_integration_logs
  FOR DELETE USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

COMMIT;
