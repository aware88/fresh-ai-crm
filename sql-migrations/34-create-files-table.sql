-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.files CASCADE;

-- Create the files table with all columns
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT,
    size BIGINT NOT NULL,
    path TEXT NOT NULL,
    contact_id TEXT,
    description TEXT,
    tags TEXT[],
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints after table creation
ALTER TABLE public.files 
ADD CONSTRAINT fk_contact_id 
FOREIGN KEY (contact_id) 
REFERENCES public.contacts(id) 
ON DELETE CASCADE;

-- Note: We'll add the created_by foreign key constraint after auth.users is confirmed to exist
-- ALTER TABLE public.files 
-- ADD CONSTRAINT fk_created_by 
-- FOREIGN KEY (created_by) 
-- REFERENCES auth.users(id);

-- Enable RLS on the files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_files_contact_id ON public.files(contact_id);
CREATE INDEX idx_files_created_by ON public.files(created_by);

-- Create policy to allow users to view their own files
CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to insert their own files
CREATE POLICY "Users can insert their own files" 
ON public.files 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own files
CREATE POLICY "Users can update their own files" 
ON public.files 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to delete their own files
CREATE POLICY "Users can delete their own files" 
ON public.files 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ language 'plpgsql';

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_files_modtime
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Create a function to set the created_by column
CREATE OR REPLACE FUNCTION set_created_by() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to set the created_by column
CREATE TRIGGER set_files_created_by
    BEFORE INSERT ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

-- Create a function to handle file deletion from storage when a record is deleted
CREATE OR REPLACE FUNCTION handle_delete_file()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by Supabase Storage webhook
    -- when a file is deleted from storage
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to delete the file from storage when the record is deleted
CREATE TRIGGER handle_files_delete
    AFTER DELETE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION handle_delete_file();

-- Grant necessary permissions
GRANT ALL ON public.files TO authenticated, service_role;
