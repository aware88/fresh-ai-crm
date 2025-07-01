-- Migration: Create Metakocka Contact Mappings Table
-- Description: Creates a table to store mappings between CRM contacts and Metakocka partners

BEGIN;

-- Create the metakocka_contact_mappings table
CREATE TABLE IF NOT EXISTS public.metakocka_contact_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  metakocka_id TEXT NOT NULL,
  metakocka_code TEXT,
  sync_status TEXT DEFAULT 'synced',
  sync_error TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- Add RLS policies
ALTER TABLE public.metakocka_contact_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for select: users can only see their own mappings
CREATE POLICY metakocka_contact_mappings_select_policy ON public.metakocka_contact_mappings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for insert: users can only insert their own mappings
CREATE POLICY metakocka_contact_mappings_insert_policy ON public.metakocka_contact_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for update: users can only update their own mappings
CREATE POLICY metakocka_contact_mappings_update_policy ON public.metakocka_contact_mappings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for delete: users can only delete their own mappings
CREATE POLICY metakocka_contact_mappings_delete_policy ON public.metakocka_contact_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS metakocka_contact_mappings_user_id_idx ON public.metakocka_contact_mappings(user_id);
CREATE INDEX IF NOT EXISTS metakocka_contact_mappings_contact_id_idx ON public.metakocka_contact_mappings(contact_id);
CREATE INDEX IF NOT EXISTS metakocka_contact_mappings_metakocka_id_idx ON public.metakocka_contact_mappings(metakocka_id);

COMMIT;
