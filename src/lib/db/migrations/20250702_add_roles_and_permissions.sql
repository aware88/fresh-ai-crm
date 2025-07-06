-- Migration: Add roles and permissions tables

-- Add pgcrypto extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum for role types if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
    CREATE TYPE role_type AS ENUM ('system_admin', 'organization_admin', 'custom');
  END IF;
END $$;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type role_type NOT NULL DEFAULT 'custom',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- System roles have null organization_id
  -- Organization-specific roles have an organization_id
  CONSTRAINT organization_role_name_unique UNIQUE NULLS NOT DISTINCT (organization_id, name)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- Insert default permissions if they don't exist
INSERT INTO permissions (name, description)
SELECT name, description FROM (
  VALUES
('admin.access', 'Access admin panel'),
('admin.users.view', 'View users'),
('admin.users.create', 'Create users'),
('admin.users.edit', 'Edit users'),
('admin.users.delete', 'Delete users'),
('admin.organizations.view', 'View organizations'),
('admin.organizations.create', 'Create organizations'),
('admin.organizations.edit', 'Edit organizations'),
('admin.organizations.delete', 'Delete organizations'),
('admin.roles.view', 'View roles'),
('admin.roles.create', 'Create roles'),
('admin.roles.edit', 'Edit roles'),
('admin.roles.delete', 'Delete roles'),
('admin.subscriptions.view', 'View subscriptions'),
('admin.subscriptions.manage', 'Manage subscriptions'),
('admin.analytics.view', 'View analytics'),
('organization.users.view', 'View organization users'),
('organization.users.invite', 'Invite users to organization'),
('organization.users.remove', 'Remove users from organization'),
('organization.settings.view', 'View organization settings'),
('organization.settings.edit', 'Edit organization settings'),
('organization.branding.edit', 'Edit organization branding'),

-- Integration permissions
('integrations.metakocka.view', 'View Metakocka integration'),
('integrations.metakocka.configure', 'Configure Metakocka integration'),
('integrations.metakocka.sync', 'Sync data with Metakocka'),
('integrations.metakocka.logs.view', 'View Metakocka error logs'),
('integrations.metakocka.logs.resolve', 'Resolve Metakocka errors'),

-- Subscription permissions
('subscription.view', 'View subscription details'),
('subscription.upgrade', 'Upgrade subscription'),
('subscription.downgrade', 'Downgrade subscription'),
('subscription.cancel', 'Cancel subscription'),
('subscription.payment.update', 'Update payment method'),

-- White-label permissions
('white-label.domains.manage', 'Manage custom domains'),
('white-label.branding.manage', 'Manage white-label branding'),
('white-label.email-templates.edit', 'Edit white-label email templates'),
('white-label.login-page.customize', 'Customize login page'),

-- Partner/reseller permissions
('partner.clients.view', 'View partner clients'),
('partner.clients.create', 'Create partner clients'),
('partner.clients.manage', 'Manage partner clients'),
('partner.billing.view', 'View partner billing')
) AS p(name, description)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = p.name);

-- Create system admin role if it doesn't exist
INSERT INTO roles (name, description, type)
SELECT 'System Administrator', 'Full system access', 'system_admin'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'System Administrator');

-- Create organization admin role template if it doesn't exist
INSERT INTO roles (name, description, type)
SELECT 'Organization Administrator', 'Full organization access', 'organization_admin'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Organization Administrator');

-- Create subscription tier roles if they don't exist
INSERT INTO roles (name, description, type)
SELECT 'Free Tier', 'Limited access for free tier users', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Free Tier');

INSERT INTO roles (name, description, type)
SELECT 'Starter Tier', 'Basic access for starter tier users', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Starter Tier');

INSERT INTO roles (name, description, type)
SELECT 'Pro Tier', 'Enhanced access for pro tier users', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Pro Tier');

INSERT INTO roles (name, description, type)
SELECT 'Business Tier', 'Advanced access for business tier users', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Business Tier');

INSERT INTO roles (name, description, type)
SELECT 'Enterprise Tier', 'Full access for enterprise tier users', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Enterprise Tier');

-- Create partner/reseller roles if they don't exist
INSERT INTO roles (name, description, type)
SELECT 'Partner', 'Access for partners and resellers', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Partner');

INSERT INTO roles (name, description, type)
SELECT 'Reseller Administrator', 'Full access for reseller administrators', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Reseller Administrator');

-- Assign all permissions to system admin role if they don't exist
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'System Administrator'), 
  p.id 
FROM permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'System Administrator')
  AND rp.permission_id = p.id
);

-- Assign organization permissions to organization admin role if they don't exist
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Organization Administrator'), 
  p.id 
FROM permissions p
WHERE p.name LIKE 'organization.%'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Organization Administrator')
  AND rp.permission_id = p.id
);

-- Assign subscription tier permissions
-- Free Tier permissions (very limited)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Free Tier'), 
  p.id 
FROM permissions p
WHERE p.name IN ('subscription.view', 'subscription.upgrade')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Free Tier')
  AND rp.permission_id = p.id
);

-- Starter Tier permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Starter Tier'), 
  p.id 
FROM permissions p
WHERE p.name IN (
  'subscription.view', 'subscription.upgrade', 'subscription.downgrade', 'subscription.cancel',
  'subscription.payment.update', 'organization.users.view'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Starter Tier')
  AND rp.permission_id = p.id
);

-- Pro Tier permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Pro Tier'), 
  p.id 
FROM permissions p
WHERE p.name IN (
  'subscription.view', 'subscription.upgrade', 'subscription.downgrade', 'subscription.cancel',
  'subscription.payment.update', 'organization.users.view', 'organization.users.invite',
  'organization.settings.view', 'integrations.metakocka.view'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Pro Tier')
  AND rp.permission_id = p.id
);

-- Business Tier permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Business Tier'), 
  p.id 
FROM permissions p
WHERE p.name IN (
  'subscription.view', 'subscription.upgrade', 'subscription.downgrade', 'subscription.cancel',
  'subscription.payment.update', 'organization.users.view', 'organization.users.invite',
  'organization.users.remove', 'organization.settings.view', 'organization.settings.edit',
  'integrations.metakocka.view', 'integrations.metakocka.configure', 'integrations.metakocka.sync',
  'integrations.metakocka.logs.view'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Business Tier')
  AND rp.permission_id = p.id
);

-- Enterprise Tier permissions (all organization and integration permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Enterprise Tier'), 
  p.id 
FROM permissions p
WHERE (p.name LIKE 'organization.%' OR p.name LIKE 'integrations.%' OR p.name LIKE 'subscription.%' OR p.name LIKE 'white-label.%')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Enterprise Tier')
  AND rp.permission_id = p.id
);

-- Partner permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Partner'), 
  p.id 
FROM permissions p
WHERE p.name LIKE 'partner.clients.%'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Partner')
  AND rp.permission_id = p.id
);

-- Reseller Administrator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Reseller Administrator'), 
  p.id 
FROM permissions p
WHERE (p.name LIKE 'partner.%' OR p.name LIKE 'white-label.%')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Reseller Administrator')
  AND rp.permission_id = p.id
);

-- Create helper functions for permission checking
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_has_permission.user_id
    AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_has_role.user_id
    AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a subscription tier role
CREATE OR REPLACE FUNCTION user_has_subscription_tier(user_id UUID, tier_level TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_has_subscription_tier.user_id
    AND r.name = tier_level || ' Tier'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_users (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);

-- RLS Policies for roles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roles_system_admin_policy') THEN
    CREATE POLICY roles_system_admin_policy ON roles
      FOR ALL
      TO authenticated
      USING (user_has_role(auth.uid(), 'System Administrator'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roles_org_admin_policy') THEN
    CREATE POLICY roles_org_admin_policy ON roles
      FOR SELECT
      TO authenticated
      USING (
        user_has_role(auth.uid(), 'Organization Administrator') AND
        organization_id IN (
          SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- RLS Policies for permissions table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'permissions_view_policy') THEN
    CREATE POLICY permissions_view_policy ON permissions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- RLS Policies for role_permissions table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_permissions_system_admin_policy') THEN
    CREATE POLICY role_permissions_system_admin_policy ON role_permissions
      FOR ALL
      TO authenticated
      USING (user_has_role(auth.uid(), 'System Administrator'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_permissions_view_policy') THEN
    CREATE POLICY role_permissions_view_policy ON role_permissions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- RLS Policies for user_roles table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_roles_system_admin_policy') THEN
    CREATE POLICY user_roles_system_admin_policy ON user_roles
      FOR ALL
      TO authenticated
      USING (user_has_role(auth.uid(), 'System Administrator'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_roles_org_admin_policy') THEN
    CREATE POLICY user_roles_org_admin_policy ON user_roles
      FOR SELECT
      TO authenticated
      USING (
        user_has_role(auth.uid(), 'Organization Administrator') AND
        EXISTS (
          SELECT 1 FROM organization_users ou1
          WHERE ou1.user_id = user_roles.user_id
          AND EXISTS (
            SELECT 1 FROM organization_users ou2
            WHERE ou2.user_id = auth.uid()
            AND ou1.organization_id = ou2.organization_id
          )
        )
      );
  END IF;
END $$;
