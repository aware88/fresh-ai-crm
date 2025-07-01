-- Migration: Add RLS policies for organization isolation
-- Description: Adds RLS policies to tables with organization_id for multi-tenant isolation

BEGIN;

-- Products table RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_policy ON products
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY products_insert_policy ON products
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY products_update_policy ON products
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY products_delete_policy ON products
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Suppliers table RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_select_policy ON suppliers
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY suppliers_insert_policy ON suppliers
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY suppliers_update_policy ON suppliers
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY suppliers_delete_policy ON suppliers
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Contacts table RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select_policy ON contacts
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY contacts_insert_policy ON contacts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY contacts_update_policy ON contacts
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY contacts_delete_policy ON contacts
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Supplier documents table RLS
ALTER TABLE supplier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_documents_select_policy ON supplier_documents
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_documents_insert_policy ON supplier_documents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY supplier_documents_update_policy ON supplier_documents
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_documents_delete_policy ON supplier_documents
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Supplier emails table RLS
ALTER TABLE supplier_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_emails_select_policy ON supplier_emails
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_emails_insert_policy ON supplier_emails
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY supplier_emails_update_policy ON supplier_emails
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_emails_delete_policy ON supplier_emails
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Supplier pricing table RLS
ALTER TABLE supplier_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_pricing_select_policy ON supplier_pricing
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_pricing_insert_policy ON supplier_pricing
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY supplier_pricing_update_policy ON supplier_pricing
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_pricing_delete_policy ON supplier_pricing
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Supplier queries table RLS
ALTER TABLE supplier_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_queries_select_policy ON supplier_queries
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_queries_insert_policy ON supplier_queries
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY supplier_queries_update_policy ON supplier_queries
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_queries_delete_policy ON supplier_queries
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Supplier query results table RLS
ALTER TABLE supplier_query_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_query_results_select_policy ON supplier_query_results
  FOR SELECT USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_query_results_insert_policy ON supplier_query_results
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY supplier_query_results_update_policy ON supplier_query_results
  FOR UPDATE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY supplier_query_results_delete_policy ON supplier_query_results
  FOR DELETE USING (
    (organization_id IS NULL) OR
    (organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Add comments
COMMENT ON TABLE products IS 'Products with organization isolation';
COMMENT ON TABLE suppliers IS 'Suppliers with organization isolation';
COMMENT ON TABLE contacts IS 'Contacts with organization isolation';
COMMENT ON TABLE supplier_documents IS 'Supplier documents with organization isolation';
COMMENT ON TABLE supplier_emails IS 'Supplier emails with organization isolation';
COMMENT ON TABLE supplier_pricing IS 'Supplier pricing with organization isolation';
COMMENT ON TABLE supplier_queries IS 'Supplier queries with organization isolation';
COMMENT ON TABLE supplier_query_results IS 'Supplier query results with organization isolation';

COMMIT;
