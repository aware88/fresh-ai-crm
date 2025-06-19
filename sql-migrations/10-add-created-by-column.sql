-- Add created_by column to interactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'interactions' 
        AND column_name = 'created_by'
    ) THEN
        -- Add the created_by column as a foreign key to auth.users
        ALTER TABLE public.interactions 
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- Add a comment for documentation
        COMMENT ON COLUMN public.interactions.created_by IS 'The user who created this interaction';
    END IF;
END $$;
