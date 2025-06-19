-- SQL migration to set up proper RLS policies for the interactions table

-- First, enable RLS on the interactions table if not already enabled
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;

-- Create policies for authenticated users
-- 1. View policy: Users can only view interactions they created
CREATE POLICY "Users can view their own interactions" 
ON public.interactions
FOR SELECT
USING (auth.uid() = created_by);

-- 2. Insert policy: Users can insert interactions but must set created_by to their user ID
CREATE POLICY "Users can insert their own interactions" 
ON public.interactions
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 3. Update policy: Users can only update interactions they created
CREATE POLICY "Users can update their own interactions" 
ON public.interactions
FOR UPDATE
USING (auth.uid() = created_by);

-- 4. Delete policy: Users can only delete interactions they created
CREATE POLICY "Users can delete their own interactions" 
ON public.interactions
FOR DELETE
USING (auth.uid() = created_by);

-- Make sure the created_by column is NOT NULL to enforce security
ALTER TABLE public.interactions ALTER COLUMN created_by SET NOT NULL;
