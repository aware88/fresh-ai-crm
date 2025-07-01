-- Migration: Add RLS policies for organization isolation
-- Description: Updates RLS policies to enforce organization-based isolation

BEGIN;

-- Update RLS policies for products
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
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
  END IF;
END $$;

-- Update RLS policies for suppliers
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    DROP POLICY IF EXISTS suppliers_select_policy ON suppliers;
    CREATE POLICY suppliers_select_policy ON suppliers
      FOR SELECT USING (
        (organization_id IS NULL AND created_by = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS suppliers_insert_policy ON suppliers;
    CREATE POLICY suppliers_insert_policy ON suppliers
      FOR INSERT WITH CHECK (
        (organization_id IS NULL AND created_by = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS suppliers_update_policy ON suppliers;
    CREATE POLICY suppliers_update_policy ON suppliers
      FOR UPDATE USING (
        (organization_id IS NULL AND created_by = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS suppliers_delete_policy ON suppliers;
    CREATE POLICY suppliers_delete_policy ON suppliers
      FOR DELETE USING (
        (organization_id IS NULL AND created_by = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );
  END IF;
END $$;

-- Update RLS policies for contacts
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    DROP POLICY IF EXISTS contacts_select_policy ON contacts;
    CREATE POLICY contacts_select_policy ON contacts
      FOR SELECT USING (
        organization_id IS NULL OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS contacts_insert_policy ON contacts;
    CREATE POLICY contacts_insert_policy ON contacts
      FOR INSERT WITH CHECK (
        organization_id IS NULL OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS contacts_update_policy ON contacts;
    CREATE POLICY contacts_update_policy ON contacts
      FOR UPDATE USING (
        organization_id IS NULL OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS contacts_delete_policy ON contacts;
    CREATE POLICY contacts_delete_policy ON contacts
      FOR DELETE USING (
        organization_id IS NULL OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );
  END IF;
END $$;

-- Update RLS policies for metakocka_integration_logs
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_integration_logs') THEN
    DROP POLICY IF EXISTS metakocka_integration_logs_select_policy ON metakocka_integration_logs;
    CREATE POLICY metakocka_integration_logs_select_policy ON metakocka_integration_logs
      FOR SELECT USING (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS metakocka_integration_logs_insert_policy ON metakocka_integration_logs;
    CREATE POLICY metakocka_integration_logs_insert_policy ON metakocka_integration_logs
      FOR INSERT WITH CHECK (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS metakocka_integration_logs_update_policy ON metakocka_integration_logs;
    CREATE POLICY metakocka_integration_logs_update_policy ON metakocka_integration_logs
      FOR UPDATE USING (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS metakocka_integration_logs_delete_policy ON metakocka_integration_logs;
    CREATE POLICY metakocka_integration_logs_delete_policy ON metakocka_integration_logs
      FOR DELETE USING (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );
  END IF;
END $$;

-- Update RLS policies for metakocka_product_mappings
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metakocka_product_mappings') THEN
    DROP POLICY IF EXISTS metakocka_product_mappings_select_policy ON metakocka_product_mappings;
    CREATE POLICY metakocka_product_mappings_select_policy ON metakocka_product_mappings
      FOR SELECT USING (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS metakocka_product_mappings_insert_policy ON metakocka_product_mappings;
    CREATE POLICY metakocka_product_mappings_insert_policy ON metakocka_product_mappings
      FOR INSERT WITH CHECK (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS metakocka_product_mappings_update_policy ON metakocka_product_mappings;
    CREATE POLICY metakocka_product_mappings_update_policy ON metakocka_product_mappings
      FOR UPDATE USING (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );

    DROP POLICY IF EXISTS metakocka_product_mappings_delete_policy ON metakocka_product_mappings;
    CREATE POLICY metakocka_product_mappings_delete_policy ON metakocka_product_mappings
      FOR DELETE USING (
        (organization_id IS NULL AND user_id = auth.uid()) OR
        (organization_id IS NOT NULL AND organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()
        ))
      );
  END IF;
END $$;

-- Add similar blocks for other tables with organization_id
-- This pattern can be repeated for all tables with organization_id

COMMIT;
