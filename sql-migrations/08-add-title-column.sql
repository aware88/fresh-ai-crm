-- Add title column to interactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'interactions' 
        AND column_name = 'title'
    ) THEN
        -- First, make the column nullable
        ALTER TABLE public.interactions 
        ADD COLUMN title VARCHAR(255);
        
        -- Add a comment for documentation
        COMMENT ON COLUMN public.interactions.title IS 'Title of the interaction';
        
        -- Set a default value for existing rows
        UPDATE public.interactions 
        SET title = 'Untitled ' || id::text 
        WHERE title IS NULL;
        
        -- Now make the column NOT NULL
        ALTER TABLE public.interactions 
        ALTER COLUMN title SET NOT NULL;
    END IF;
END $$;
