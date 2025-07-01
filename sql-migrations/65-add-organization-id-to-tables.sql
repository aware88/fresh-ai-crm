-- Migration: Add organization_id to key tables
-- Description: Adds organization_id column to key tables for multi-tenant support

BEGIN;

-- Add organization_id to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to suppliers table
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to interactions table
ALTER TABLE interactions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to emails table
ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to files table
ALTER TABLE files
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to metakocka_credentials table
ALTER TABLE metakocka_credentials
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to metakocka_product_mappings table
ALTER TABLE metakocka_product_mappings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to metakocka_contact_mappings table
ALTER TABLE metakocka_contact_mappings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to metakocka_sales_document_mappings table
ALTER TABLE metakocka_sales_document_mappings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to metakocka_integration_logs table
ALTER TABLE metakocka_integration_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to sales_documents table
ALTER TABLE sales_documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to sales_document_items table
ALTER TABLE sales_document_items
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_interactions_organization_id ON interactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_organization_id ON emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_files_organization_id ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_credentials_organization_id ON metakocka_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_organization_id ON metakocka_product_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_organization_id ON metakocka_contact_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_organization_id ON metakocka_sales_document_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_organization_id ON metakocka_integration_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_documents_organization_id ON sales_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_document_items_organization_id ON sales_document_items(organization_id);

-- Add comments
COMMENT ON COLUMN contacts.organization_id IS 'Reference to the organization this contact belongs to';
COMMENT ON COLUMN products.organization_id IS 'Reference to the organization this product belongs to';
COMMENT ON COLUMN suppliers.organization_id IS 'Reference to the organization this supplier belongs to';
COMMENT ON COLUMN interactions.organization_id IS 'Reference to the organization this interaction belongs to';
COMMENT ON COLUMN emails.organization_id IS 'Reference to the organization this email belongs to';
COMMENT ON COLUMN files.organization_id IS 'Reference to the organization this file belongs to';
COMMENT ON COLUMN metakocka_credentials.organization_id IS 'Reference to the organization these credentials belong to';
COMMENT ON COLUMN metakocka_product_mappings.organization_id IS 'Reference to the organization this mapping belongs to';
COMMENT ON COLUMN metakocka_contact_mappings.organization_id IS 'Reference to the organization this mapping belongs to';
COMMENT ON COLUMN metakocka_sales_document_mappings.organization_id IS 'Reference to the organization this mapping belongs to';
COMMENT ON COLUMN metakocka_integration_logs.organization_id IS 'Reference to the organization this log belongs to';
COMMENT ON COLUMN sales_documents.organization_id IS 'Reference to the organization this sales document belongs to';
COMMENT ON COLUMN sales_document_items.organization_id IS 'Reference to the organization this sales document item belongs to';

COMMIT;
