-- Migration: Create Role-Based Access Control (RBAC) policies and functions
-- Description: Adds RLS policies and helper functions for the RBAC system

-- Enable Row Level Security on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS roles_admin_policy ON public.roles;
  DROP POLICY IF EXISTS roles_select_policy ON public.roles;
  DROP POLICY IF EXISTS roles_insert_policy ON public.roles;
  DROP POLICY IF EXISTS roles_update_policy ON public.roles;
  DROP POLICY IF EXISTS roles_delete_policy ON public.roles;
  
  DROP POLICY IF EXISTS permissions_admin_policy ON public.permissions;
  DROP POLICY IF EXISTS permissions_select_policy ON public.permissions;
  
  DROP POLICY IF EXISTS role_permissions_admin_policy ON public.role_permissions;
  DROP POLICY IF EXISTS role_permissions_org_admin_select_policy ON public.role_permissions;
  DROP POLICY IF EXISTS role_permissions_org_admin_insert_policy ON public.role_permissions;
  DROP POLICY IF EXISTS role_permissions_org_admin_delete_policy ON public.role_permissions;
  DROP POLICY IF EXISTS role_permissions_user_select_policy ON public.role_permissions;
  
  DROP POLICY IF EXISTS user_roles_admin_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_org_admin_select_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_org_admin_insert_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_org_admin_delete_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_user_select_policy ON public.user_roles;
END $$;

-- 1. Roles Policies

-- Admin Policy (full access for system admins)
CREATE POLICY roles_admin_policy ON public.roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Select Policy (view access)
CREATE POLICY roles_select_policy ON public.roles
  FOR SELECT
  USING (
    -- System admins can see all roles
    (SELECT raw_user_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid() LIMIT 1) = true
    -- Or it's a system role
    OR type = 'system_admin'
    -- Or user is a member of the organization
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
      AND organization_id = public.roles.organization_id
    )
  );

-- Insert Policy
CREATE POLICY roles_insert_policy ON public.roles
  FOR INSERT
  WITH CHECK (
    -- Only system admins can insert system_admin roles
    (
      type = 'system_admin' AND 
      (SELECT raw_user_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid() LIMIT 1) = true
    ) OR
    -- Organization admins can insert org roles
    (
      type IN ('organization_admin', 'custom') AND
      organization_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()
        AND organization_id = public.roles.organization_id
        AND role = 'admin'
      )
    )
  );

-- Update Policy
CREATE POLICY roles_update_policy ON public.roles
  FOR UPDATE
  USING (
    -- Only system admins can update system_admin roles
    (
      type = 'system_admin' AND 
      (SELECT raw_user_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid() LIMIT 1) = true
    ) OR
    -- Organization admins can update org roles
    (
      type IN ('organization_admin', 'custom') AND
      organization_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()
        AND organization_id = public.roles.organization_id
        AND role = 'admin'
      )
    )
  );

-- Delete Policy
CREATE POLICY roles_delete_policy ON public.roles
  FOR DELETE
  USING (
    -- Only system admins can delete system_admin roles
    (
      type = 'system_admin' AND 
      (SELECT raw_user_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid() LIMIT 1) = true
    ) OR
    -- Organization admins can delete org roles
    (
      type IN ('organization_admin', 'custom') AND
      organization_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid()
        AND organization_id = public.roles.organization_id
        AND role = 'admin'
      )
    )
  );

-- 2. Permissions Policies

-- Only system admins can manage permissions
CREATE POLICY permissions_admin_policy ON public.permissions
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- All authenticated users can view permissions
CREATE POLICY permissions_select_policy ON public.permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3. Role Permissions Policies

-- System admins can do anything with role_permissions
CREATE POLICY role_permissions_admin_policy ON public.role_permissions
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Organization admins can view role_permissions for their organization's roles
CREATE POLICY role_permissions_org_admin_select_policy ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      JOIN public.organization_members om ON r.organization_id = om.organization_id
      WHERE public.role_permissions.role_id = r.id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE public.role_permissions.role_id = r.id
      AND r.type = 'system_admin'
    )
  );

-- Organization admins can insert role_permissions for their organization's custom roles
CREATE POLICY role_permissions_org_admin_insert_policy ON public.role_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles r
      JOIN public.organization_members om ON r.organization_id = om.organization_id
      WHERE NEW.role_id = r.id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND r.type IN ('organization_admin', 'custom')
    )
  );

-- Organization admins can delete role_permissions for their organization's custom roles
CREATE POLICY role_permissions_org_admin_delete_policy ON public.role_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      JOIN public.organization_members om ON r.organization_id = om.organization_id
      WHERE public.role_permissions.role_id = r.id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND r.type IN ('organization_admin', 'custom')
    )
  );

-- Regular users can view role_permissions for their organization's roles and system roles
CREATE POLICY role_permissions_user_select_policy ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      JOIN public.organization_members om ON r.organization_id = om.organization_id
      WHERE public.role_permissions.role_id = r.id
      AND om.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE public.role_permissions.role_id = r.id
      AND r.type = 'system_admin'
    )
  );

-- 4. User Roles Policies

-- System admins can do anything with user_roles
CREATE POLICY user_roles_admin_policy ON public.user_roles
  FOR ALL  -- This covers SELECT, INSERT, UPDATE, DELETE
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Organization admins can view user_roles for users in their organization
CREATE POLICY user_roles_org_admin_select_policy ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      JOIN public.roles r ON public.user_roles.role_id = r.id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = public.user_roles.user_id
      AND om1.role = 'admin'
      AND (
        r.organization_id = om1.organization_id 
        OR r.type = 'system_admin'
      )
    )
  );

-- Organization admins can assign roles to users in their organization
CREATE POLICY user_roles_org_admin_insert_policy ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      JOIN public.roles r ON NEW.role_id = r.id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = NEW.user_id
      AND om1.role = 'admin'
      AND (
        r.organization_id = om1.organization_id 
        OR r.type = 'system_admin'
      )
    )
  );

-- Organization admins can remove roles from users in their organization
CREATE POLICY user_roles_org_admin_delete_policy ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      JOIN public.roles r ON public.user_roles.role_id = r.id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = public.user_roles.user_id
      AND om1.role = 'admin'
      AND (
        r.organization_id = om1.organization_id 
        OR r.type = 'system_admin'
      )
    )
  );

-- Users can view their own roles
CREATE POLICY user_roles_user_select_policy ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- 5. Helper Functions

-- Create function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource_type TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- Check if user is a system admin (they have all permissions)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id AND raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has the specific permission through their roles
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.resource_type = p_resource_type
    AND p.action = p_action
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- Create function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID
)
RETURNS TABLE (
  resource_type TEXT,
  action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is a system admin (they have all permissions)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id AND raw_user_meta_data->>'is_admin' = 'true'
  ) THEN
    RETURN QUERY
    SELECT p.resource_type, p.action
    FROM permissions p;
    RETURN;
  END IF;
  
  -- Return all permissions the user has through their roles
  RETURN QUERY
  SELECT DISTINCT p.resource_type, p.action
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id;
  
  RETURN;
END;
$$;

-- Create function to assign a role to a user
CREATE OR REPLACE FUNCTION assign_role_to_user(
  p_user_id UUID,
  p_role_id UUID,
  p_assigned_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_organization_id UUID;
  v_role_type role_type;
  v_assigner_is_admin BOOLEAN;
  v_assigner_is_org_admin BOOLEAN;
BEGIN
  -- Get role information
  SELECT organization_id, type
  INTO v_organization_id, v_role_type
  FROM roles
  WHERE id = p_role_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found';
  END IF;
  
  -- Check if assigner is system admin
  SELECT (raw_user_meta_data->>'is_admin')::boolean INTO v_assigner_is_admin
  FROM auth.users
  WHERE id = p_assigned_by;
  
  -- If it's a system role, only system admins can assign it
  IF v_role_type = 'system_admin' AND NOT v_assigner_is_admin THEN
    RAISE EXCEPTION 'Only system administrators can assign system roles';
  END IF;
  
  -- If it's an organization role, check if assigner is an org admin
  IF v_role_type IN ('organization_admin', 'custom') THEN
    SELECT EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = p_assigned_by
      AND organization_id = v_organization_id
      AND role = 'admin'
    ) INTO v_assigner_is_org_admin;
    
    IF NOT v_assigner_is_admin AND NOT v_assigner_is_org_admin THEN
      RAISE EXCEPTION 'Only organization administrators can assign organization roles';
    END IF;
    
    -- Check if user is a member of the organization
    IF NOT EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = p_user_id
      AND organization_id = v_organization_id
    ) THEN
      RAISE EXCEPTION 'User is not a member of the organization';
    END IF;
  END IF;
  
  -- Insert or update the user role
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (p_user_id, p_role_id, p_assigned_by)
  ON CONFLICT (user_id, role_id)
  DO UPDATE SET
    assigned_by = EXCLUDED.assigned_by,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  -- Log the audit event
  PERFORM log_audit_event(
    p_assigned_by,
    v_organization_id,
    'create',
    'user_role',
    v_id::TEXT,
    NULL,
    jsonb_build_object(
      'user_id', p_user_id,
      'role_id', p_role_id
    ),
    jsonb_build_object('action', 'role_assigned')
  );
  
  RETURN v_id;
END;
$$;

-- Create function to revoke a role from a user
CREATE OR REPLACE FUNCTION revoke_role_from_user(
  p_user_id UUID,
  p_role_id UUID,
  p_revoked_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id UUID;
  v_role_type role_type;
  v_revoker_is_admin BOOLEAN;
  v_revoker_is_org_admin BOOLEAN;
  v_user_role_id UUID;
BEGIN
  -- Get role information
  SELECT organization_id, type
  INTO v_organization_id, v_role_type
  FROM roles
  WHERE id = p_role_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found';
  END IF;
  
  -- Get user role ID
  SELECT id INTO v_user_role_id
  FROM user_roles
  WHERE user_id = p_user_id AND role_id = p_role_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User does not have this role';
  END IF;
  
  -- Check if revoker is system admin
  SELECT (raw_user_meta_data->>'is_admin')::boolean INTO v_revoker_is_admin
  FROM auth.users
  WHERE id = p_revoked_by;
  
  -- If it's a system role, only system admins can revoke it
  IF v_role_type = 'system_admin' AND NOT v_revoker_is_admin THEN
    RAISE EXCEPTION 'Only system administrators can revoke system roles';
  END IF;
  
  -- If it's an organization role, check if revoker is an org admin
  IF v_role_type IN ('organization_admin', 'custom') THEN
    SELECT EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = p_revoked_by
      AND organization_id = v_organization_id
      AND role = 'admin'
    ) INTO v_revoker_is_org_admin;
    
    IF NOT v_revoker_is_admin AND NOT v_revoker_is_org_admin THEN
      RAISE EXCEPTION 'Only organization administrators can revoke organization roles';
    END IF;
  END IF;
  
  -- Delete the user role
  DELETE FROM user_roles
  WHERE id = v_user_role_id;
  
  -- Log the audit event
  PERFORM log_audit_event(
    p_revoked_by,
    v_organization_id,
    'delete',
    'user_role',
    v_user_role_id::TEXT,
    jsonb_build_object(
      'user_id', p_user_id,
      'role_id', p_role_id
    ),
    NULL,
    jsonb_build_object('action', 'role_revoked')
  );
  
  RETURN true;
END;
$$;
