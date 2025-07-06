-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_organization_id ON user_activity_logs(organization_id);

-- Add RLS policies
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all activity logs
CREATE POLICY admin_select_user_activity_logs ON user_activity_logs 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Allow users to view their own activity logs
CREATE POLICY user_select_own_activity_logs ON user_activity_logs 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Allow organization admins to view activity logs for their organization
CREATE POLICY org_admin_select_activity_logs ON user_activity_logs 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'org_admin' 
      AND users.organization_id = user_activity_logs.organization_id
    )
  );

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_details JSONB DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, details, organization_id)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details, p_organization_id)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to use the function
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO service_role;
