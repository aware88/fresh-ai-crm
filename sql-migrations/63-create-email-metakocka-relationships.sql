-- Migration: 63-create-email-metakocka-relationships.sql
-- Description: Creates tables and relationships to connect emails with Metakocka entities

-- Enable uuid-ossp extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start a transaction to ensure all changes are applied atomically
BEGIN;

-- Create a table to map emails to Metakocka contacts
CREATE TABLE IF NOT EXISTS public.email_metakocka_contact_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    metakocka_contact_id TEXT NOT NULL,
    metakocka_mapping_id UUID REFERENCES public.metakocka_contact_mappings(id) ON DELETE SET NULL,
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(email_id, metakocka_contact_id)
);

-- Create a table to map emails to Metakocka sales documents
CREATE TABLE IF NOT EXISTS public.email_metakocka_document_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    metakocka_document_id TEXT NOT NULL,
    metakocka_mapping_id UUID REFERENCES public.metakocka_sales_document_mappings(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(email_id, metakocka_document_id)
);

-- Add a metakocka_metadata column to the emails table
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS metakocka_metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_metakocka_contact_mappings_email_id 
ON public.email_metakocka_contact_mappings(email_id);

CREATE INDEX IF NOT EXISTS idx_email_metakocka_contact_mappings_metakocka_contact_id 
ON public.email_metakocka_contact_mappings(metakocka_contact_id);

CREATE INDEX IF NOT EXISTS idx_email_metakocka_contact_mappings_metakocka_mapping_id 
ON public.email_metakocka_contact_mappings(metakocka_mapping_id);

CREATE INDEX IF NOT EXISTS idx_email_metakocka_document_mappings_email_id 
ON public.email_metakocka_document_mappings(email_id);

CREATE INDEX IF NOT EXISTS idx_email_metakocka_document_mappings_metakocka_document_id 
ON public.email_metakocka_document_mappings(metakocka_document_id);

CREATE INDEX IF NOT EXISTS idx_email_metakocka_document_mappings_metakocka_mapping_id 
ON public.email_metakocka_document_mappings(metakocka_mapping_id);

CREATE INDEX IF NOT EXISTS idx_emails_metakocka_metadata 
ON public.emails USING gin(metakocka_metadata);

-- Enable Row Level Security on the new tables
ALTER TABLE public.email_metakocka_contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_metakocka_document_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_metakocka_contact_mappings
CREATE POLICY "Users can view their own email-contact mappings" 
ON public.email_metakocka_contact_mappings 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own email-contact mappings" 
ON public.email_metakocka_contact_mappings 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own email-contact mappings" 
ON public.email_metakocka_contact_mappings 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own email-contact mappings" 
ON public.email_metakocka_contact_mappings 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create RLS policies for email_metakocka_document_mappings
CREATE POLICY "Users can view their own email-document mappings" 
ON public.email_metakocka_document_mappings 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own email-document mappings" 
ON public.email_metakocka_document_mappings 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own email-document mappings" 
ON public.email_metakocka_document_mappings 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own email-document mappings" 
ON public.email_metakocka_document_mappings 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create triggers to set the created_by column
CREATE TRIGGER set_email_metakocka_contact_mappings_created_by
    BEFORE INSERT ON public.email_metakocka_contact_mappings
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_email_metakocka_document_mappings_created_by
    BEFORE INSERT ON public.email_metakocka_document_mappings
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

-- Create triggers to update the updated_at timestamp
CREATE TRIGGER update_email_metakocka_contact_mappings_updated_at
    BEFORE UPDATE ON public.email_metakocka_contact_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_metakocka_document_mappings_updated_at
    BEFORE UPDATE ON public.email_metakocka_document_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.email_metakocka_contact_mappings IS 'Maps emails to Metakocka contacts for bidirectional reference';
COMMENT ON TABLE public.email_metakocka_document_mappings IS 'Maps emails to Metakocka sales documents for bidirectional reference';
COMMENT ON COLUMN public.emails.metakocka_metadata IS 'Metadata related to Metakocka entities mentioned in the email';
COMMENT ON COLUMN public.email_metakocka_contact_mappings.confidence IS 'Confidence score for the mapping (0.0-1.0)';
COMMENT ON COLUMN public.email_metakocka_document_mappings.confidence IS 'Confidence score for the mapping (0.0-1.0)';
COMMENT ON COLUMN public.email_metakocka_document_mappings.document_type IS 'Type of Metakocka document (invoice, offer, etc.)';

-- Commit the transaction
COMMIT;
