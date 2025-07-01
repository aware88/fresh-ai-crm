-- 60-create-sales-documents-table.sql
-- Creates a table to store sales documents (invoices, offers, etc.) in the CRM
-- Run this in the Supabase SQL editor or include it in your CI migration pipeline.

BEGIN;

-- Create the sales_documents table
CREATE TABLE IF NOT EXISTS sales_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'offer', 'order', 'proforma')),
  document_number TEXT,
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  customer_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_email TEXT,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  
  -- Add a unique constraint for document numbers within the same user and document type
  UNIQUE(user_id, document_type, document_number)
);

-- Create the sales_document_items table for line items
CREATE TABLE IF NOT EXISTS sales_document_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES sales_documents(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(15, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_documents_user_id ON sales_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_documents_customer_id ON sales_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_documents_document_type ON sales_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_sales_documents_status ON sales_documents(status);
CREATE INDEX IF NOT EXISTS idx_sales_document_items_document_id ON sales_document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_sales_document_items_product_id ON sales_document_items(product_id);

-- Add RLS policies
ALTER TABLE sales_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_document_items ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only see their own sales documents
CREATE POLICY select_sales_documents ON sales_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for insert: users can only insert their own sales documents
CREATE POLICY insert_sales_documents ON sales_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for update: users can only update their own sales documents
CREATE POLICY update_sales_documents ON sales_documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for delete: users can only delete their own sales documents
CREATE POLICY delete_sales_documents ON sales_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for select: users can only see items from their own sales documents
CREATE POLICY select_sales_document_items ON sales_document_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_documents
      WHERE sales_documents.id = sales_document_items.document_id
      AND sales_documents.user_id = auth.uid()
    )
  );

-- Policy for insert: users can only insert items to their own sales documents
CREATE POLICY insert_sales_document_items ON sales_document_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_documents
      WHERE sales_documents.id = sales_document_items.document_id
      AND sales_documents.user_id = auth.uid()
    )
  );

-- Policy for update: users can only update items from their own sales documents
CREATE POLICY update_sales_document_items ON sales_document_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sales_documents
      WHERE sales_documents.id = sales_document_items.document_id
      AND sales_documents.user_id = auth.uid()
    )
  );

-- Policy for delete: users can only delete items from their own sales documents
CREATE POLICY delete_sales_document_items ON sales_document_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sales_documents
      WHERE sales_documents.id = sales_document_items.document_id
      AND sales_documents.user_id = auth.uid()
    )
  );

COMMIT;
