-- 61-create-metakocka-sales-document-mappings-table.sql
-- Creates a table to store mappings between CRM sales documents and Metakocka documents
-- Run this in the Supabase SQL editor or include it in your CI migration pipeline.

BEGIN;

-- Create the metakocka_sales_document_mappings table
CREATE TABLE IF NOT EXISTS metakocka_sales_document_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES sales_documents(id) ON DELETE CASCADE,
  metakocka_id TEXT NOT NULL,
  metakocka_document_type TEXT NOT NULL,
  metakocka_document_number TEXT,
  metakocka_status TEXT,
  sync_direction TEXT NOT NULL DEFAULT 'crm_to_metakocka' CHECK (sync_direction IN ('crm_to_metakocka', 'metakocka_to_crm', 'bidirectional')),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error', 'needs_review')),
  sync_error TEXT,
  metadata JSONB,
  
  -- Add a unique constraint to prevent duplicate mappings
  UNIQUE(user_id, document_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_user_id ON metakocka_sales_document_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_document_id ON metakocka_sales_document_mappings(document_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_sales_document_mappings_metakocka_id ON metakocka_sales_document_mappings(metakocka_id);

-- Add RLS policies
ALTER TABLE metakocka_sales_document_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only see their own mappings
CREATE POLICY select_metakocka_sales_document_mappings ON metakocka_sales_document_mappings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for insert: users can only insert their own mappings
CREATE POLICY insert_metakocka_sales_document_mappings ON metakocka_sales_document_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for update: users can only update their own mappings
CREATE POLICY update_metakocka_sales_document_mappings ON metakocka_sales_document_mappings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for delete: users can only delete their own mappings
CREATE POLICY delete_metakocka_sales_document_mappings ON metakocka_sales_document_mappings
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;
