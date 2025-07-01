-- Enable uuid-ossp extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.supplier_emails CASCADE;

-- Create the supplier_emails table with all columns
CREATE TABLE public.supplier_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    subject TEXT,
    body TEXT,
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on the supplier_emails table
ALTER TABLE public.supplier_emails ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_supplier_emails_supplier_id ON public.supplier_emails(supplier_id);
CREATE INDEX idx_supplier_emails_sender_email ON public.supplier_emails(sender_email);
CREATE INDEX idx_supplier_emails_received_date ON public.supplier_emails(received_date);
CREATE INDEX idx_supplier_emails_created_by ON public.supplier_emails(created_by);

-- Create policy to allow users to view their own supplier emails
CREATE POLICY "Users can view their own supplier emails" 
ON public.supplier_emails 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to insert their own supplier emails
CREATE POLICY "Users can insert their own supplier emails" 
ON public.supplier_emails 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own supplier emails
CREATE POLICY "Users can update their own supplier emails" 
ON public.supplier_emails 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to delete their own supplier emails
CREATE POLICY "Users can delete their own supplier emails" 
ON public.supplier_emails 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Add comments for documentation
COMMENT ON TABLE public.supplier_emails IS 'Stores emails related to suppliers';
COMMENT ON COLUMN public.supplier_emails.product_tags IS 'Tags related to products mentioned in the email';
COMMENT ON COLUMN public.supplier_emails.metadata IS 'Additional metadata in JSON format';
