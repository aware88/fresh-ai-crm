-- Migration: Create default RBAC roles and permissions
-- Description: Adds default roles and assigns permissions to them

-- Insert default permissions
INSERT INTO permissions (name, description, resource_type, action)
VALUES
  -- Contact permissions
  ('contact:read', 'View contacts', 'contact', 'read'),
  ('contact:create', 'Create new contacts', 'contact', 'create'),
  ('contact:update', 'Update contact details', 'contact', 'update'),
  ('contact:delete', 'Delete contacts', 'contact', 'delete'),
  
  -- Interaction permissions
  ('interaction:read', 'View interactions', 'interaction', 'read'),
  ('interaction:create', 'Create new interactions', 'interaction', 'create'),
  ('interaction:update', 'Update interaction details', 'interaction', 'update'),
  ('interaction:delete', 'Delete interactions', 'interaction', 'delete'),
  
  -- File permissions
  ('file:read', 'View files', 'file', 'read'),
  ('file:create', 'Upload new files', 'file', 'create'),
  ('file:update', 'Update file details', 'file', 'update'),
  ('file:delete', 'Delete files', 'file', 'delete'),
  
  -- Organization permissions
  ('organization:read', 'View organization details', 'organization', 'read'),
  ('organization:update', 'Update organization details', 'organization', 'update'),
  
  -- Member permissions
  ('member:read', 'View organization members', 'member', 'read'),
  ('member:invite', 'Invite new members', 'member', 'create'),
  ('member:update', 'Update member details', 'member', 'update'),
  ('member:remove', 'Remove members', 'member', 'delete'),
  
  -- Subscription permissions
  ('subscription:read', 'View subscription details', 'subscription', 'read'),
  ('subscription:update', 'Update subscription', 'subscription', 'update'),
  ('subscription:cancel', 'Cancel subscription', 'subscription', 'delete'),
  
  -- Billing permissions
  ('billing:read', 'View billing details', 'billing', 'read'),
  ('billing:update', 'Update billing information', 'billing', 'update'),
  
  -- Integration permissions
  ('integration:read', 'View integrations', 'integration', 'read'),
  ('integration:create', 'Create integrations', 'integration', 'create'),
  ('integration:update', 'Update integrations', 'integration', 'update'),
  ('integration:delete', 'Delete integrations', 'integration', 'delete'),
  
  -- Webhook permissions
  ('webhook:read', 'View webhooks', 'webhook', 'read'),
  ('webhook:create', 'Create webhooks', 'webhook', 'create'),
  ('webhook:update', 'Update webhooks', 'webhook', 'update'),
  ('webhook:delete', 'Delete webhooks', 'webhook', 'delete'),
  
  -- Role permissions
  ('role:read', 'View roles', 'role', 'read'),
  ('role:create', 'Create roles', 'role', 'create'),
  ('role:update', 'Update roles', 'role', 'update'),
  ('role:delete', 'Delete roles', 'role', 'delete'),
  ('role:assign', 'Assign roles to users', 'role', 'assign'),
  
  -- Audit log permissions
  ('audit:read', 'View audit logs', 'audit', 'read'),
  
  -- Settings permissions
  ('settings:read', 'View settings', 'settings', 'read'),
  ('settings:update', 'Update settings', 'settings', 'update')
ON CONFLICT (resource_type, action) DO NOTHING;

-- Create default system roles

-- Super Admin role (has all permissions)
INSERT INTO roles (name, description, is_system_role)
VALUES ('Super Admin', 'Has full access to all system features', true)
ON CONFLICT (name, organization_id) DO NOTHING;

-- Get the Super Admin role ID
DO $$
DECLARE
  v_super_admin_role_id UUID;
BEGIN
  SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'Super Admin' AND is_system_role = true;
  
  -- Assign all permissions to Super Admin role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_super_admin_role_id, id FROM permissions
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$;

-- Create default organization roles

-- Organization Admin role
DO $$
DECLARE
  v_org_admin_role_id UUID;
  v_permission_id UUID;
BEGIN
  -- Create the Organization Admin role
  INSERT INTO roles (name, description, is_system_role)
  VALUES ('Organization Admin', 'Has full access to organization features', true)
  ON CONFLICT (name, organization_id) DO NOTHING;
  
  SELECT id INTO v_org_admin_role_id FROM roles WHERE name = 'Organization Admin' AND is_system_role = true;
  
  -- Assign all organization-level permissions to Organization Admin role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_org_admin_role_id, id FROM permissions
  WHERE resource_type IN ('organization', 'member', 'contact', 'interaction', 'file', 'subscription', 'billing', 'integration', 'webhook', 'role', 'audit', 'settings')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$;

-- Member role (basic access)
DO $$
DECLARE
  v_member_role_id UUID;
BEGIN
  -- Create the Member role
  INSERT INTO roles (name, description, is_system_role)
  VALUES ('Member', 'Basic access to organization features', true)
  ON CONFLICT (name, organization_id) DO NOTHING;
  
  SELECT id INTO v_member_role_id FROM roles WHERE name = 'Member' AND is_system_role = true;
  
  -- Assign read permissions to Member role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_member_role_id, id FROM permissions
  WHERE action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Add specific write permissions for basic functionality
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_member_role_id, id FROM permissions
  WHERE name IN ('contact:create', 'contact:update', 'interaction:create', 'interaction:update', 'file:create')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$;

-- Note: has_permission function is already defined in the policies migration file

-- Viewer role (read-only access)
DO $$
DECLARE
  v_viewer_role_id UUID;
BEGIN
  -- Create the Viewer role
  INSERT INTO roles (name, description, is_system_role)
  VALUES ('Viewer', 'Read-only access to organization features', true)
  ON CONFLICT (name, organization_id) DO NOTHING;
  
  SELECT id INTO v_viewer_role_id FROM roles WHERE name = 'Viewer' AND is_system_role = true;
  
  -- Assign read permissions to Viewer role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_viewer_role_id, id FROM permissions
  WHERE action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$;
