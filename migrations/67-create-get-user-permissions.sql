-- Create function to get all permissions for the current user
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TABLE (
  resource_type TEXT,
  name TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is system admin
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    -- Return all permissions for system admins
    RETURN QUERY
    SELECT p.resource_type, p.name, p.description
    FROM permissions p;
  ELSE
    -- Return only permissions assigned through roles
    RETURN QUERY
    SELECT DISTINCT p.resource_type, p.name, p.description
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_permissions() TO authenticated;
