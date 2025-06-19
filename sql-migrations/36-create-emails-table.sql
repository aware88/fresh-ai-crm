-- Enable uuid-ossp extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.emails CASCADE;

-- Create the emails table with all columns
CREATE TABLE public.emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender TEXT NOT NULL,
    subject TEXT,
    raw_content TEXT,
    analysis TEXT,
    contact_id TEXT REFERENCES public.contacts(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID NOT NULL
);

-- Enable RLS on the emails table
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_emails_sender ON public.emails(sender);
CREATE INDEX idx_emails_contact_id ON public.emails(contact_id);
CREATE INDEX idx_emails_created_by ON public.emails(created_by);

-- Create policy to allow users to view their own emails
CREATE POLICY "Users can view their own emails" 
ON public.emails 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to insert their own emails
CREATE POLICY "Users can insert their own emails" 
ON public.emails 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own emails
CREATE POLICY "Users can update their own emails" 
ON public.emails 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to delete their own emails
CREATE POLICY "Users can delete their own emails" 
ON public.emails 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create a trigger to set the created_by column
CREATE TRIGGER set_emails_created_by
    BEFORE INSERT ON public.emails
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();
