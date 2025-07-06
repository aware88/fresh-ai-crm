-- Drop existing policies
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
  DROP POLICY IF EXISTS role_permissions_select_policy ON public.role_permissions;

  DROP POLICY IF EXISTS user_roles_admin_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_org_admin_select_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_org_admin_insert_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_org_admin_delete_policy ON public.user_roles;
  DROP POLICY IF EXISTS user_roles_user_select_policy ON public.user_roles;
END $$;

-- Enable RLS on all RBAC tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1. Basic policies for system admins
CREATE POLICY roles_admin_policy ON public.roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

CREATE POLICY permissions_admin_policy ON public.permissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

CREATE POLICY role_permissions_admin_policy ON public.role_permissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

CREATE POLICY user_roles_admin_policy ON public.user_roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- 2. Basic read-only policies for all users
CREATE POLICY roles_select_policy ON public.roles
  FOR SELECT
  USING (true);

CREATE POLICY permissions_select_policy ON public.permissions
  FOR SELECT
  USING (true);

-- 3. User roles policies for organization admins
-- Organization admins can view user_roles for users in their organization
CREATE POLICY user_roles_org_admin_select_policy ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
      AND om2.user_id = public.user_roles.user_id
      AND om1.role = 'admin'
    )
  );

-- Users can view their own roles
CREATE POLICY user_roles_user_select_policy ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. Role permissions policies
-- Organization members can view role_permissions for their organization
CREATE POLICY role_permissions_select_policy ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      JOIN public.organization_members om ON r.organization_id = om.organization_id
      WHERE public.role_permissions.role_id = r.id
      AND om.user_id = auth.uid()
    )
  );

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
  -- Check if user is system admin
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id AND raw_user_meta_data->>'is_admin' = 'true'
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;

  -- Check if user has the permission through their roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND p.resource_type = p_resource_type
    AND p.action = p_action
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;
