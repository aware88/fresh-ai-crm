-- Migration: Add organization_id to tables
-- Description: Adds organization_id column to key tables for multi-tenant support

BEGIN;

-- Add organization_id to products table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
  END IF;
END $$;

-- Add organization_id to suppliers table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    ALTER TABLE suppliers
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON suppliers(organization_id);
  END IF;
END $$;

-- Add organization_id to contacts table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
  END IF;
END $$;

-- Add organization_id to supplier_documents table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_documents') THEN
    ALTER TABLE supplier_documents
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_supplier_documents_organization_id ON supplier_documents(organization_id);
  END IF;
END $$;

-- Add organization_id to supplier_emails table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_emails') THEN
    ALTER TABLE supplier_emails
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_supplier_emails_organization_id ON supplier_emails(organization_id);
  END IF;
END $$;

-- Add organization_id to supplier_pricing table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_pricing') THEN
    ALTER TABLE supplier_pricing
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_supplier_pricing_organization_id ON supplier_pricing(organization_id);
  END IF;
END $$;

-- Add organization_id to supplier_queries table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_queries') THEN
    ALTER TABLE supplier_queries
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_supplier_queries_organization_id ON supplier_queries(organization_id);
  END IF;
END $$;

-- Add organization_id to supplier_query_results table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_query_results') THEN
    ALTER TABLE supplier_query_results
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_supplier_query_results_organization_id ON supplier_query_results(organization_id);
  END IF;
END $$;

-- Add organization_id to metakocka_credentials table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_credentials') THEN
    ALTER TABLE metakocka_credentials
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_metakocka_credentials_organization_id ON metakocka_credentials(organization_id);
  END IF;
END $$;

-- Add organization_id to metakocka_product_mappings table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_product_mappings') THEN
    ALTER TABLE metakocka_product_mappings
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_organization_id ON metakocka_product_mappings(organization_id);
  END IF;
END $$;

-- Add organization_id to metakocka_contact_mappings table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_contact_mappings') THEN
    ALTER TABLE metakocka_contact_mappings
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_metakocka_contact_mappings_organization_id ON metakocka_contact_mappings(organization_id);
  END IF;
END $$;

-- Add organization_id to metakocka_sales_document_mappings table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_sales_document_mappings') THEN
    ALTER TABLE metakocka_sales_document_mappings
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_organization_id ON metakocka_sales_document_mappings(organization_id);
  END IF;
END $$;

-- Add organization_id to sales_documents table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_documents') THEN
    ALTER TABLE sales_documents
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_sales_documents_organization_id ON sales_documents(organization_id);
  END IF;
END $$;

-- Add organization_id to sales_document_items table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_document_items') THEN
    ALTER TABLE sales_document_items
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_sales_document_items_organization_id ON sales_document_items(organization_id);
  END IF;
END $$;

-- Add organization_id to metakocka_integration_logs table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_integration_logs') THEN
    ALTER TABLE metakocka_integration_logs
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_organization_id ON metakocka_integration_logs(organization_id);
  END IF;
END $$;

-- Add organization_id to email_metakocka_relationships table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_metakocka_relationships') THEN
    ALTER TABLE email_metakocka_relationships
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    
    CREATE INDEX IF NOT EXISTS idx_email_metakocka_relationships_organization_id ON email_metakocka_relationships(organization_id);
  END IF;
END $$;

COMMIT;
