-- Migration: Create organization_branding table
-- Description: Creates a table to store organization branding settings

-- Create the organization_branding table
CREATE TABLE IF NOT EXISTS organization_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  font_family TEXT,
  custom_css TEXT,
  custom_domain TEXT,
  favicon_url TEXT,
  email_header_image_url TEXT,
  email_footer_text TEXT,
  login_background_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id)
);

-- Add RLS policies
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- Policy: Only organization members can view their organization's branding
CREATE POLICY "Organization members can view their organization's branding" 
  ON organization_branding
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only organization admins can modify their organization's branding
CREATE POLICY "Organization admins can modify their organization's branding" 
  ON organization_branding
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System admins can view all organization branding
CREATE POLICY "System admins can view all organization branding" 
  ON organization_branding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System admins can modify all organization branding
CREATE POLICY "System admins can modify all organization branding" 
  ON organization_branding
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_organization_branding_updated_at
  BEFORE UPDATE ON organization_branding
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
