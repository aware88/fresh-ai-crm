-- Add user_id column to emails table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE emails ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Update existing records with a default user (you may need to adjust this)
    -- This is just an example - you might want to handle this differently
    -- UPDATE emails SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
    
    -- Make the column NOT NULL after populating it
    -- ALTER TABLE emails ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

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
