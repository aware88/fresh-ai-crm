-- Migration: Create Metakocka sales document mappings table
-- Description: Creates a table to store mappings between CRM sales documents and Metakocka documents

BEGIN;

-- Create table for storing Metakocka sales document mappings
DO $$
BEGIN
  -- First create the table without the foreign key constraint
  CREATE TABLE IF NOT EXISTS metakocka_sales_document_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    metakocka_id VARCHAR(255) NOT NULL,
    metakocka_document_type VARCHAR(50) NOT NULL, -- 'sales_bill', 'offer', 'order', etc.
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'synced',
    sync_error TEXT,
    metadata JSONB
  );
  
  -- Then add the sales_document_id column separately
  ALTER TABLE metakocka_sales_document_mappings ADD COLUMN IF NOT EXISTS sales_document_id UUID;
  
  -- Add the foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'metakocka_sales_document_mappings_sales_document_id_fkey'
  ) THEN
    ALTER TABLE metakocka_sales_document_mappings 
    ADD CONSTRAINT metakocka_sales_document_mappings_sales_document_id_fkey 
    FOREIGN KEY (sales_document_id) REFERENCES sales_documents(id) ON DELETE CASCADE;
  END IF;
  
  -- Add NOT NULL constraint if it doesn't exist
  ALTER TABLE metakocka_sales_document_mappings ALTER COLUMN sales_document_id SET NOT NULL;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'metakocka_sales_document_mappings_sales_document_id_metakocka_id_key'
  ) THEN
    ALTER TABLE metakocka_sales_document_mappings 
    ADD CONSTRAINT metakocka_sales_document_mappings_sales_document_id_metakocka_id_key 
    UNIQUE(sales_document_id, metakocka_id);
  END IF;
  
  -- Add organization_or_user_required constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'organization_or_user_required'
  ) THEN
    ALTER TABLE metakocka_sales_document_mappings 
    ADD CONSTRAINT organization_or_user_required 
    CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting up metakocka_sales_document_mappings table: %', SQLERRM;
END $$;

-- Add indexes for faster lookups
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metakocka_sales_document_mappings' AND column_name = 'sales_document_id') THEN
    CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_sales_document_id ON metakocka_sales_document_mappings(sales_document_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metakocka_sales_document_mappings' AND column_name = 'metakocka_id') THEN
    CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_metakocka_id ON metakocka_sales_document_mappings(metakocka_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metakocka_sales_document_mappings' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_user_id ON metakocka_sales_document_mappings(user_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metakocka_sales_document_mappings' AND column_name = 'organization_id') THEN
    CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_organization_id ON metakocka_sales_document_mappings(organization_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating indexes for metakocka_sales_document_mappings: %', SQLERRM;
END $$;

-- Add RLS policies
DO $$
BEGIN
  ALTER TABLE metakocka_sales_document_mappings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error enabling RLS on metakocka_sales_document_mappings: %', SQLERRM;
END $$;

-- Policy: Users can view mappings for their sales documents or organization sales documents
DO $$
BEGIN
  DROP POLICY IF EXISTS metakocka_sales_document_mappings_select_policy ON metakocka_sales_document_mappings;
  CREATE POLICY metakocka_sales_document_mappings_select_policy ON metakocka_sales_document_mappings
    FOR SELECT USING (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating metakocka_sales_document_mappings_select_policy: %', SQLERRM;
END $$;

-- Policy: Users can insert mappings for their sales documents or organization sales documents
DO $$
BEGIN
  DROP POLICY IF EXISTS metakocka_sales_document_mappings_insert_policy ON metakocka_sales_document_mappings;
  CREATE POLICY metakocka_sales_document_mappings_insert_policy ON metakocka_sales_document_mappings
    FOR INSERT WITH CHECK (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating metakocka_sales_document_mappings_insert_policy: %', SQLERRM;
END $$;

-- Policy: Users can update mappings for their sales documents or organization sales documents
DO $$
BEGIN
  DROP POLICY IF EXISTS metakocka_sales_document_mappings_update_policy ON metakocka_sales_document_mappings;
  CREATE POLICY metakocka_sales_document_mappings_update_policy ON metakocka_sales_document_mappings
    FOR UPDATE USING (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating metakocka_sales_document_mappings_update_policy: %', SQLERRM;
END $$;

-- Policy: Users can delete mappings for their sales documents or organization sales documents
DO $$
BEGIN
  DROP POLICY IF EXISTS metakocka_sales_document_mappings_delete_policy ON metakocka_sales_document_mappings;
  CREATE POLICY metakocka_sales_document_mappings_delete_policy ON metakocka_sales_document_mappings
    FOR DELETE USING (
      (organization_id IS NULL AND user_id = auth.uid()) OR
      (organization_id IS NOT NULL AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ))
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating metakocka_sales_document_mappings_delete_policy: %', SQLERRM;
END $$;

-- Add comments
COMMENT ON TABLE metakocka_sales_document_mappings IS 'Stores mappings between CRM sales documents and Metakocka documents';

COMMIT;
