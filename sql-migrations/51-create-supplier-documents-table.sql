-- Enable uuid-ossp extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.supplier_documents CASCADE;

-- Create the supplier_documents table with all columns
CREATE TABLE public.supplier_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- PDF, Excel, CSV
    document_type TEXT NOT NULL, -- Offer, CoA, Specification, Invoice
    file_path TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on the supplier_documents table
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_supplier_documents_supplier_id ON public.supplier_documents(supplier_id);
CREATE INDEX idx_supplier_documents_document_type ON public.supplier_documents(document_type);
CREATE INDEX idx_supplier_documents_created_by ON public.supplier_documents(created_by);

-- Create policy to allow users to view their own supplier documents
CREATE POLICY "Users can view their own supplier documents" 
ON public.supplier_documents 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to insert their own supplier documents
CREATE POLICY "Users can insert their own supplier documents" 
ON public.supplier_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own supplier documents
CREATE POLICY "Users can update their own supplier documents" 
ON public.supplier_documents 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to delete their own supplier documents
CREATE POLICY "Users can delete their own supplier documents" 
ON public.supplier_documents 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Add comments for documentation
COMMENT ON TABLE public.supplier_documents IS 'Stores documents related to suppliers';
COMMENT ON COLUMN public.supplier_documents.file_type IS 'Type of file (PDF, Excel, CSV)';
COMMENT ON COLUMN public.supplier_documents.document_type IS 'Type of document (Offer, CoA, Specification, Invoice)';
COMMENT ON COLUMN public.supplier_documents.metadata IS 'Additional metadata in JSON format';
