-- Migration: Enable Row Level Security and create policies for interactions table
-- This script sets up proper security for the interactions table
-- Run this in your Supabase SQL Editor AFTER running 04-ensure-interactions-table.sql

-- Enable Row Level Security on the interactions table
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- This is similar to your contacts table policy
CREATE OR REPLACE POLICY "Enable all operations for authenticated users" 
ON public.interactions
FOR ALL 
TO authenticated
USING (true);

-- For more granular control, you can use these policies instead:
-- CREATE POLICY "Enable read access for all users" 
--     ON public.interactions 
--     FOR SELECT 
--     USING (true);

-- CREATE POLICY "Enable insert for authenticated users" 
--     ON public.interactions 
--     FOR INSERT 
--     WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Users can update their own interactions" 
--     ON public.interactions
--     FOR UPDATE 
--     USING (auth.uid()::text = created_by)
--     WITH CHECK (auth.uid()::text = created_by);

-- CREATE POLICY "Users can delete their own interactions" 
--     ON public.interactions
--     FOR DELETE 
--     USING (auth.uid()::text = created_by);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO anon;

-- Create a function to set the created_by field automatically
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid()::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_interactions_created_by'
    ) THEN
        CREATE TRIGGER set_interactions_created_by
            BEFORE INSERT ON public.interactions
            FOR EACH ROW
            EXECUTE FUNCTION public.set_created_by();
    END IF;
END $$;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'interactions';
