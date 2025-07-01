-- Migration: Add organization_id to tables
-- Description: Adds organization_id column to key tables for multi-tenant support

BEGIN;

-- Add organization_id to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to suppliers table
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to contacts table
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to supplier_documents table
ALTER TABLE supplier_documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to supplier_emails table
ALTER TABLE supplier_emails
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to supplier_pricing table
ALTER TABLE supplier_pricing
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to supplier_queries table
ALTER TABLE supplier_queries
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to supplier_query_results table
ALTER TABLE supplier_query_results
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to metakocka_credentials table
ALTER TABLE metakocka_credentials
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to metakocka_product_mappings table
ALTER TABLE metakocka_product_mappings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to metakocka_contact_mappings table
ALTER TABLE metakocka_contact_mappings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to metakocka_sales_document_mappings table
ALTER TABLE metakocka_sales_document_mappings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to sales_documents table
ALTER TABLE sales_documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to sales_document_items table
ALTER TABLE sales_document_items
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_documents_organization_id ON supplier_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_emails_organization_id ON supplier_emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_organization_id ON supplier_pricing(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_queries_organization_id ON supplier_queries(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_query_results_organization_id ON supplier_query_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_credentials_organization_id ON metakocka_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_organization_id ON metakocka_product_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_organization_id ON metakocka_contact_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_organization_id ON metakocka_sales_document_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_documents_organization_id ON sales_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_document_items_organization_id ON sales_document_items(organization_id);

COMMIT;
