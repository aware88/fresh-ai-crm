-- Migration: Create organization_branding table
-- Description: Adds a table for storing organization branding settings

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comment to the table
COMMENT ON TABLE organization_branding IS 'Stores organization branding settings for white-label customization';

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_branding_organization_id ON organization_branding(organization_id);

-- Add unique constraint to ensure one branding record per organization
ALTER TABLE organization_branding ADD CONSTRAINT unique_organization_branding UNIQUE (organization_id);

-- Set up Row Level Security (RLS)
-- Enable RLS on the table
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Allow organization members to view their organization's branding
CREATE POLICY organization_branding_select_policy ON organization_branding
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- 2. Allow organization admins to update their organization's branding
CREATE POLICY organization_branding_update_policy ON organization_branding
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Allow organization admins to insert branding for their organization
CREATE POLICY organization_branding_insert_policy ON organization_branding
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Allow organization admins to delete their organization's branding
CREATE POLICY organization_branding_delete_policy ON organization_branding
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_branding_updated_at_trigger
BEFORE UPDATE ON organization_branding
FOR EACH ROW
EXECUTE FUNCTION update_organization_branding_updated_at();
