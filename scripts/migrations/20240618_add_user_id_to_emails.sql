-- Add user_id column to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to include user_id check
DROP POLICY IF EXISTS "Users can view their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can insert their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can update their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can delete their own emails" ON public.emails;

-- Recreate RLS policies with user_id check
CREATE POLICY "Users can view their own emails" 
ON public.emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails" 
ON public.emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails" 
ON public.emails 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails" 
ON public.emails 
FOR DELETE 
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.emails TO authenticated;
