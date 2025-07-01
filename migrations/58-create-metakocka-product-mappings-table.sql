-- Migration: Create metakocka_product_mappings table
-- Description: Creates a dedicated table to store mappings between CRM products and Metakocka products

BEGIN;

-- Create the metakocka_product_mappings table
CREATE TABLE IF NOT EXISTS public.metakocka_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    metakocka_id VARCHAR(255) NOT NULL,
    metakocka_code VARCHAR(255),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'synced',
    sync_error TEXT,
    metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_user_id ON public.metakocka_product_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_metakocka_product_mappings_product_id ON public.metakocka_product_mappings(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_metakocka_product_mappings_product_user ON public.metakocka_product_mappings(product_id, user_id);

-- Add RLS policies for security
ALTER TABLE public.metakocka_product_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for select: Users can only view their own mappings
CREATE POLICY select_metakocka_product_mappings ON public.metakocka_product_mappings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for insert: Users can only insert their own mappings
CREATE POLICY insert_metakocka_product_mappings ON public.metakocka_product_mappings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for update: Users can only update their own mappings
CREATE POLICY update_metakocka_product_mappings ON public.metakocka_product_mappings
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for delete: Users can only delete their own mappings
CREATE POLICY delete_metakocka_product_mappings ON public.metakocka_product_mappings
    FOR DELETE USING (auth.uid() = user_id);

-- Add a comment to the table
COMMENT ON TABLE public.metakocka_product_mappings IS 'Maps CRM products to Metakocka products';

COMMIT;
