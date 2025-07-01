-- Migration: Create organizations table
-- Description: Adds table to store organization data for multi-tenant support

BEGIN;

-- Create table for storing organization data
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  logo_url TEXT,
  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),
  domain VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create organization_members junction table for user-organization relationships
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_owner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, user_id)
);

-- Add RLS policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view organizations they are members of
CREATE POLICY organizations_select_policy ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
    )
  );

-- Policy: Only organization owners can update organization details
CREATE POLICY organizations_update_policy ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
      AND (is_owner = TRUE OR role = 'admin')
    )
  );

-- Policy: Users can create organizations
CREATE POLICY organizations_insert_policy ON organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Only organization owners can delete organizations
CREATE POLICY organizations_delete_policy ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
      AND is_owner = TRUE
    )
  );

-- Add RLS policies for organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of organizations they belong to
CREATE POLICY organization_members_select_policy ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = auth.uid()
    )
  );

-- Policy: Only organization admins/owners can add members
CREATE POLICY organization_members_insert_policy ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid()
      AND (is_owner = TRUE OR role = 'admin')
    ) OR 
    -- Allow users to accept invitations to join
    (auth.uid() = user_id)
  );

-- Policy: Only organization admins/owners can update member roles
CREATE POLICY organization_members_update_policy ON organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid()
      AND (is_owner = TRUE OR role = 'admin')
    )
  );

-- Policy: Only organization admins/owners can remove members
CREATE POLICY organization_members_delete_policy ON organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid()
      AND (is_owner = TRUE OR role = 'admin')
    ) OR 
    -- Allow users to remove themselves
    (auth.uid() = user_id)
  );

-- Add comments
COMMENT ON TABLE organizations IS 'Stores organization data for multi-tenant support';
COMMENT ON TABLE organization_members IS 'Junction table for user-organization relationships';

-- Create indexes for faster lookups
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON organization_members(organization_id);

-- Create function to automatically add the creator as an owner when creating an organization
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, is_owner)
  VALUES (NEW.id, NEW.created_by, 'admin', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new organization is created
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

COMMIT;
