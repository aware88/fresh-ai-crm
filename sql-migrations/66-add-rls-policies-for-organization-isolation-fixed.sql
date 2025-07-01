-- Migration: Add RLS policies for organization isolation
-- Description: Updates RLS policies to enforce organization-based isolation

BEGIN;

-- Update RLS policies for products
DROP POLICY IF EXISTS products_select_policy ON products;
CREATE POLICY products_select_policy ON products
  FOR SELECT USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS products_insert_policy ON products;
CREATE POLICY products_insert_policy ON products
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS products_update_policy ON products;
CREATE POLICY products_update_policy ON products
  FOR UPDATE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS products_delete_policy ON products;
CREATE POLICY products_delete_policy ON products
  FOR DELETE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Update RLS policies for suppliers
DROP POLICY IF EXISTS suppliers_select_policy ON suppliers;
CREATE POLICY suppliers_select_policy ON suppliers
  FOR SELECT USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS suppliers_insert_policy ON suppliers;
CREATE POLICY suppliers_insert_policy ON suppliers
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS suppliers_update_policy ON suppliers;
CREATE POLICY suppliers_update_policy ON suppliers
  FOR UPDATE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS suppliers_delete_policy ON suppliers;
CREATE POLICY suppliers_delete_policy ON suppliers
  FOR DELETE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Update RLS policies for contacts
DROP POLICY IF EXISTS contacts_select_policy ON contacts;
CREATE POLICY contacts_select_policy ON contacts
  FOR SELECT USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS contacts_insert_policy ON contacts;
CREATE POLICY contacts_insert_policy ON contacts
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS contacts_update_policy ON contacts;
CREATE POLICY contacts_update_policy ON contacts
  FOR UPDATE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS contacts_delete_policy ON contacts;
CREATE POLICY contacts_delete_policy ON contacts
  FOR DELETE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Update RLS policies for supplier_documents
DROP POLICY IF EXISTS supplier_documents_select_policy ON supplier_documents;
CREATE POLICY supplier_documents_select_policy ON supplier_documents
  FOR SELECT USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS supplier_documents_insert_policy ON supplier_documents;
CREATE POLICY supplier_documents_insert_policy ON supplier_documents
  FOR INSERT WITH CHECK (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS supplier_documents_update_policy ON supplier_documents;
CREATE POLICY supplier_documents_update_policy ON supplier_documents
  FOR UPDATE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS supplier_documents_delete_policy ON supplier_documents;
CREATE POLICY supplier_documents_delete_policy ON supplier_documents
  FOR DELETE USING (
    (organization_id IS NULL AND user_id = auth.uid()) OR
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Add similar policies for other tables with organization_id
-- This is a template for updating the remaining tables

COMMIT;
