-- Create organization_branding table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(organization_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organization_branding_org_id ON organization_branding(organization_id);

-- Add RLS policies
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all organization branding
CREATE POLICY admin_manage_organization_branding ON organization_branding 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Allow organization admins to manage their organization's branding
CREATE POLICY org_admin_manage_organization_branding ON organization_branding 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'org_admin' 
      AND users.organization_id = organization_branding.organization_id
    )
  );

-- Allow all authenticated users to view their organization's branding
CREATE POLICY user_view_organization_branding ON organization_branding 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = organization_branding.organization_id
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organization_branding_updated_at
BEFORE UPDATE ON organization_branding
FOR EACH ROW
EXECUTE FUNCTION update_organization_branding_updated_at();

-- Create trigger to set created_by and updated_by
CREATE OR REPLACE FUNCTION set_organization_branding_user_tracking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_organization_branding_user
BEFORE INSERT OR UPDATE ON organization_branding
FOR EACH ROW
EXECUTE FUNCTION set_organization_branding_user_tracking();
