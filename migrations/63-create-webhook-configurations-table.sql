-- Migration: Create webhook configurations table
-- Description: Adds tables and functions for webhook security and management

-- Create webhook_configurations table
CREATE TABLE IF NOT EXISTS webhook_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB
);

-- Create webhook_deliveries table to track webhook delivery attempts
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhook_configurations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes
CREATE INDEX IF NOT EXISTS webhook_configurations_organization_id_idx ON webhook_configurations(organization_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_webhook_id_idx ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_status_idx ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS webhook_deliveries_next_retry_at_idx ON webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Add RLS policies
ALTER TABLE webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Organization members can view their organization's webhook configurations
CREATE POLICY webhook_configurations_select_policy ON webhook_configurations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only organization admins can manage webhook configurations
CREATE POLICY webhook_configurations_insert_policy ON webhook_configurations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY webhook_configurations_update_policy ON webhook_configurations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY webhook_configurations_delete_policy ON webhook_configurations
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Organization members can view their organization's webhook deliveries
CREATE POLICY webhook_deliveries_select_policy ON webhook_deliveries
  FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM webhook_configurations
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Only the system can insert, update, or delete webhook deliveries
CREATE POLICY webhook_deliveries_insert_policy ON webhook_deliveries
  FOR INSERT
  WITH CHECK (auth.uid() = '00000000-0000-0000-0000-000000000000');

CREATE POLICY webhook_deliveries_update_policy ON webhook_deliveries
  FOR UPDATE
  USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

CREATE POLICY webhook_deliveries_delete_policy ON webhook_deliveries
  FOR DELETE
  USING (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Create function to rotate webhook secret
CREATE OR REPLACE FUNCTION rotate_webhook_secret(webhook_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_secret TEXT;
  affected_rows INTEGER;
BEGIN
  -- Generate a new secret (32 bytes hex)
  new_secret := encode(gen_random_bytes(32), 'hex');
  
  -- Update the webhook configuration
  UPDATE webhook_configurations
  SET 
    secret_key = new_secret,
    updated_at = NOW()
  WHERE id = webhook_id
  AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows = 0 THEN
    RAISE EXCEPTION 'Webhook not found or permission denied';
  END IF;
  
  RETURN new_secret;
END;
$$;
