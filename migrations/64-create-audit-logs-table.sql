-- Migration: Create audit logs table
-- Description: Adds tables and functions for comprehensive audit logging

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_organization_id_idx ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_type_idx ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_entity_id_idx ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Only system and admins can insert audit logs
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = '00000000-0000-0000-0000-000000000000' OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Organization admins can view audit logs for their organization
CREATE POLICY audit_logs_select_policy_admin ON audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- System admins can view all audit logs
CREATE POLICY audit_logs_select_policy_system_admin ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- No one can update or delete audit logs
CREATE POLICY audit_logs_update_policy ON audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY audit_logs_delete_policy ON audit_logs
  FOR DELETE
  USING (false);

-- Create function to log an audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_organization_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_previous_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs(
    user_id,
    organization_id,
    action_type,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_previous_state,
    p_new_state,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Create triggers for automatic audit logging on important tables

-- Function to create an audit log entry from a table change
CREATE OR REPLACE FUNCTION create_audit_log_from_table_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_organization_id UUID;
  v_action_type TEXT;
  v_entity_type TEXT;
  v_entity_id TEXT;
  v_previous_state JSONB;
  v_new_state JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Set the entity type based on the table name
  v_entity_type := TG_TABLE_NAME;
  
  -- Set the action type based on the operation
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create';
    v_previous_state := NULL;
    v_new_state := to_jsonb(NEW);
    v_entity_id := NEW.id::TEXT;
    
    -- Get organization ID if it exists in the record
    IF NEW.organization_id IS NOT NULL THEN
      v_organization_id := NEW.organization_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update';
    v_previous_state := to_jsonb(OLD);
    v_new_state := to_jsonb(NEW);
    v_entity_id := NEW.id::TEXT;
    
    -- Get organization ID if it exists in the record
    IF NEW.organization_id IS NOT NULL THEN
      v_organization_id := NEW.organization_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete';
    v_previous_state := to_jsonb(OLD);
    v_new_state := NULL;
    v_entity_id := OLD.id::TEXT;
    
    -- Get organization ID if it exists in the record
    IF OLD.organization_id IS NOT NULL THEN
      v_organization_id := OLD.organization_id;
    END IF;
  END IF;
  
  -- Log the audit event
  PERFORM log_audit_event(
    v_user_id,
    v_organization_id,
    v_action_type,
    v_entity_type,
    v_entity_id,
    v_previous_state,
    v_new_state
  );
  
  -- Return the appropriate record based on the operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for important tables

-- Subscription changes
CREATE TRIGGER audit_organization_subscriptions_trigger
AFTER INSERT OR UPDATE OR DELETE ON organization_subscriptions
FOR EACH ROW EXECUTE FUNCTION create_audit_log_from_table_change();

-- User role changes
CREATE TRIGGER audit_organization_members_trigger
AFTER INSERT OR UPDATE OR DELETE ON organization_members
FOR EACH ROW EXECUTE FUNCTION create_audit_log_from_table_change();

-- Organization changes
CREATE TRIGGER audit_organizations_trigger
AFTER INSERT OR UPDATE OR DELETE ON organizations
FOR EACH ROW EXECUTE FUNCTION create_audit_log_from_table_change();

-- Webhook configuration changes
CREATE TRIGGER audit_webhook_configurations_trigger
AFTER INSERT OR UPDATE OR DELETE ON webhook_configurations
FOR EACH ROW EXECUTE FUNCTION create_audit_log_from_table_change();
