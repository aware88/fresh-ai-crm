-- Migration: Create email queue table
-- Description: This migration creates a table for storing and managing incoming emails that need to be processed

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  processing_attempts INT NOT NULL DEFAULT 0,
  last_processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  requires_manual_review BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES auth.users(id),
  due_at TIMESTAMPTZ
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS email_queue_status_idx ON email_queue(status);
CREATE INDEX IF NOT EXISTS email_queue_priority_idx ON email_queue(priority);
CREATE INDEX IF NOT EXISTS email_queue_created_at_idx ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS email_queue_contact_id_idx ON email_queue(contact_id);
CREATE INDEX IF NOT EXISTS email_queue_created_by_idx ON email_queue(created_by);
CREATE INDEX IF NOT EXISTS email_queue_organization_id_idx ON email_queue(organization_id);

-- Add RLS policies for multi-tenant security
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Policy for select operations
CREATE POLICY email_queue_select_policy ON email_queue
  FOR SELECT USING (
    (organization_id IS NULL AND created_by = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy for insert operations
CREATE POLICY email_queue_insert_policy ON email_queue
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND created_by = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy for update operations
CREATE POLICY email_queue_update_policy ON email_queue
  FOR UPDATE USING (
    (organization_id IS NULL AND created_by = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Policy for delete operations
CREATE POLICY email_queue_delete_policy ON email_queue
  FOR DELETE USING (
    (organization_id IS NULL AND created_by = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_updated_at
BEFORE UPDATE ON email_queue
FOR EACH ROW
EXECUTE FUNCTION update_email_queue_updated_at();
