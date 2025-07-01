-- Migration: Create sales documents table
-- Description: Creates tables to store sales documents and their line items

BEGIN;

-- Create table for storing sales documents
CREATE TABLE IF NOT EXISTS sales_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_type VARCHAR(50) NOT NULL, -- 'invoice', 'quote', 'order', etc.
  document_number VARCHAR(100),
  document_date DATE NOT NULL,
  due_date DATE,
  -- contact_id with no foreign key constraint to allow flexibility
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_address TEXT,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'cancelled', etc.
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  CONSTRAINT organization_or_user_required CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Add contact_id column separately to handle potential errors
DO $$
BEGIN
  ALTER TABLE sales_documents ADD COLUMN IF NOT EXISTS contact_id TEXT;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add contact_id column: %', SQLERRM;
END $$;

-- Create table for storing sales document line items
DO $$
BEGIN
  -- First create the table without the foreign key constraint
  CREATE TABLE IF NOT EXISTS sales_document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    product_id UUID REFERENCES products(id),
    description TEXT NOT NULL,
    quantity DECIMAL(15, 3) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_rate DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
  );
  
  -- Then add the sales_document_id column separately
  ALTER TABLE sales_document_items ADD COLUMN IF NOT EXISTS sales_document_id UUID;
  
  -- Add the foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sales_document_items_sales_document_id_fkey'
  ) THEN
    ALTER TABLE sales_document_items 
    ADD CONSTRAINT sales_document_items_sales_document_id_fkey 
    FOREIGN KEY (sales_document_id) REFERENCES sales_documents(id) ON DELETE CASCADE;
  END IF;
  
  -- Add NOT NULL constraint if it doesn't exist
  ALTER TABLE sales_document_items ALTER COLUMN sales_document_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting up sales_document_items table: %', SQLERRM;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sales_documents_organization_id ON sales_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_documents_user_id ON sales_documents(user_id);
-- Only create the index if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_documents' AND column_name = 'contact_id') THEN
    CREATE INDEX IF NOT EXISTS idx_sales_documents_contact_id ON sales_documents(contact_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_sales_documents_document_type ON sales_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_sales_documents_status ON sales_documents(status);
CREATE INDEX IF NOT EXISTS idx_sales_documents_document_date ON sales_documents(document_date);

-- Only create the index if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_document_items' AND column_name = 'sales_document_id') THEN
    CREATE INDEX IF NOT EXISTS idx_sales_document_items_sales_document_id ON sales_document_items(sales_document_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_sales_document_items_product_id ON sales_document_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_document_items_organization_id ON sales_document_items(organization_id);

-- Add RLS policies for sales_documents
DO $$
BEGIN
  ALTER TABLE sales_documents ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error enabling RLS on sales_documents: %', SQLERRM;
END $$;

-- Policy: Users can view their own documents or organization documents
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_documents_select_policy ON sales_documents;
  CREATE POLICY sales_documents_select_policy ON sales_documents
    FOR SELECT USING (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_documents_select_policy: %', SQLERRM;
END $$;

-- Policy: Users can insert documents for themselves or their organizations
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_documents_insert_policy ON sales_documents;
  CREATE POLICY sales_documents_insert_policy ON sales_documents
    FOR INSERT WITH CHECK (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_documents_insert_policy: %', SQLERRM;
END $$;

-- Policy: Users can update their own documents or organization documents
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_documents_update_policy ON sales_documents;
  CREATE POLICY sales_documents_update_policy ON sales_documents
    FOR UPDATE USING (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_documents_update_policy: %', SQLERRM;
END $$;

-- Policy: Users can delete their own documents or organization documents
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_documents_delete_policy ON sales_documents;
  CREATE POLICY sales_documents_delete_policy ON sales_documents
    FOR DELETE USING (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_documents_delete_policy: %', SQLERRM;
END $$;

-- Add RLS policies for sales_document_items
DO $$
BEGIN
  ALTER TABLE sales_document_items ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error enabling RLS on sales_document_items: %', SQLERRM;
END $$;

-- Policy: Users can view items for documents they have access to
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_document_items_select_policy ON sales_document_items;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_document_items' AND column_name = 'sales_document_id') THEN
    CREATE POLICY sales_document_items_select_policy ON sales_document_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM sales_documents
          WHERE id = sales_document_items.sales_document_id
          AND (
            (organization_id IS NULL AND user_id = auth.uid()) OR
            (organization_id IS NOT NULL AND organization_id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
            ))
          )
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_document_items_select_policy: %', SQLERRM;
END $$;

-- Policy: Users can insert items for documents they have access to
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_document_items_insert_policy ON sales_document_items;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_document_items' AND column_name = 'sales_document_id') THEN
    CREATE POLICY sales_document_items_insert_policy ON sales_document_items
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM sales_documents
          WHERE id = sales_document_items.sales_document_id
          AND (
            (organization_id IS NULL AND user_id = auth.uid()) OR
            (organization_id IS NOT NULL AND organization_id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
            ))
          )
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_document_items_insert_policy: %', SQLERRM;
END $$;

-- Policy: Users can update items for documents they have access to
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_document_items_update_policy ON sales_document_items;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_document_items' AND column_name = 'sales_document_id') THEN
    CREATE POLICY sales_document_items_update_policy ON sales_document_items
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM sales_documents
          WHERE id = sales_document_items.sales_document_id
          AND (
            (organization_id IS NULL AND user_id = auth.uid()) OR
            (organization_id IS NOT NULL AND organization_id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
            ))
          )
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_document_items_update_policy: %', SQLERRM;
END $$;

-- Policy: Users can delete items for documents they have access to
DO $$
BEGIN
  DROP POLICY IF EXISTS sales_document_items_delete_policy ON sales_document_items;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_document_items' AND column_name = 'sales_document_id') THEN
    CREATE POLICY sales_document_items_delete_policy ON sales_document_items
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM sales_documents
          WHERE id = sales_document_items.sales_document_id
          AND (
            (organization_id IS NULL AND user_id = auth.uid()) OR
            (organization_id IS NOT NULL AND organization_id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
            ))
          )
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating sales_document_items_delete_policy: %', SQLERRM;
END $$;

-- Add comments
COMMENT ON TABLE sales_documents IS 'Stores sales documents such as invoices, quotes, and orders';
COMMENT ON TABLE sales_document_items IS 'Stores line items for sales documents';

COMMIT;
