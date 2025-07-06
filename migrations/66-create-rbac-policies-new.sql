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

-- 1. Roles Policies

-- System admins can do anything with roles
CREATE POLICY roles_admin_policy ON public.roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Everyone can view roles
CREATE POLICY roles_select_policy ON public.roles
  FOR SELECT
  USING (true);

-- Organization admins can create custom roles for their organization
CREATE POLICY roles_insert_policy ON public.roles
  FOR INSERT
  WITH CHECK (
    (type = 'custom') AND
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = NEW.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Organization admins can update custom roles for their organization
CREATE POLICY roles_update_policy ON public.roles
  FOR UPDATE
  USING (
    (type = 'custom') AND
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.roles.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    (type = 'custom') AND
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = NEW.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Organization admins can delete custom roles for their organization
CREATE POLICY roles_delete_policy ON public.roles
  FOR DELETE
  USING (
    (type = 'custom') AND
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.roles.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 2. Permissions Policies

-- System admins can do anything with permissions
CREATE POLICY permissions_admin_policy ON public.permissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Everyone can view permissions
CREATE POLICY permissions_select_policy ON public.permissions
  FOR SELECT
  USING (true);

-- 3. Role Permissions Policies

-- System admins can do anything with role_permissions
CREATE POLICY role_permissions_admin_policy ON public.role_permissions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Organization admins can assign permissions to their organization's custom roles
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

-- Organization admins can delete permissions from their organization's custom roles
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

-- Organization members can view role_permissions for their organization
CREATE POLICY role_permissions_org_admin_select_policy ON public.role_permissions
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
  FOR ALL
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

-- Create function to assign a role to a user
CREATE OR REPLACE FUNCTION assign_role(
  p_user_id UUID,
  p_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_type TEXT;
  v_org_id UUID;
  v_is_admin BOOLEAN;
  v_is_org_admin BOOLEAN;
BEGIN
  -- Get role type and organization
  SELECT type, organization_id INTO v_role_type, v_org_id FROM public.roles WHERE id = p_role_id;
  
  -- Check if current user is system admin
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ) INTO v_is_admin;
  
  -- Check if current user is organization admin
  IF v_org_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = v_org_id
      AND user_id = auth.uid()
      AND role = 'admin'
    ) INTO v_is_org_admin;
  ELSE
    v_is_org_admin := FALSE;
  END IF;
  
  -- Validate permissions
  IF v_is_admin OR 
     (v_is_org_admin AND v_role_type IN ('organization_admin', 'custom')) THEN
    -- Insert the role assignment if it doesn't exist
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (p_user_id, p_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  ELSE
    RAISE EXCEPTION 'Permission denied to assign this role';
  END IF;
END;
$$;

-- Create function to revoke a role from a user
CREATE OR REPLACE FUNCTION revoke_role(
  p_user_id UUID,
  p_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_type TEXT;
  v_org_id UUID;
  v_is_admin BOOLEAN;
  v_is_org_admin BOOLEAN;
BEGIN
  -- Get role type and organization
  SELECT type, organization_id INTO v_role_type, v_org_id FROM public.roles WHERE id = p_role_id;
  
  -- Check if current user is system admin
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
  ) INTO v_is_admin;
  
  -- Check if current user is organization admin
  IF v_org_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = v_org_id
      AND user_id = auth.uid()
      AND role = 'admin'
    ) INTO v_is_org_admin;
  ELSE
    v_is_org_admin := FALSE;
  END IF;
  
  -- Validate permissions
  IF v_is_admin OR 
     (v_is_org_admin AND v_role_type IN ('organization_admin', 'custom')) THEN
    -- Delete the role assignment
    DELETE FROM public.user_roles
    WHERE user_id = p_user_id AND role_id = p_role_id;
  ELSE
    RAISE EXCEPTION 'Permission denied to revoke this role';
  END IF;
END;
$$;
