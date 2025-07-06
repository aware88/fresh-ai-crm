-- Migration: Create Role-Based Access Control (RBAC) tables
-- Description: Adds tables and functions for enhanced role-based access control

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Check if organizations table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    RAISE EXCEPTION 'The "organizations" table does not exist. Please create it before running this migration.';
  END IF;
  
  -- Check if role_type enum exists, create it if not
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
    CREATE TYPE role_type AS ENUM ('system_admin', 'organization_admin', 'custom');
  END IF;
END $$;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type role_type NOT NULL DEFAULT 'custom',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- System admin role must have null organization_id
  -- Organization admin and custom roles must have an organization_id
  CONSTRAINT check_role_type CHECK (
    (type = 'system_admin' AND organization_id IS NULL) OR
    (type IN ('organization_admin', 'custom') AND organization_id IS NOT NULL)
  ),
  -- Role names must be unique within their scope (system-wide or per organization)
  CONSTRAINT unique_role_name UNIQUE (name, organization_id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite unique constraint on resource_type and action
  CONSTRAINT unique_permission UNIQUE (resource_type, action)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each permission can only be assigned once to a role
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each role can only be assigned once to a user
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS roles_organization_id_idx ON roles(organization_id);
CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON user_roles(role_id);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
