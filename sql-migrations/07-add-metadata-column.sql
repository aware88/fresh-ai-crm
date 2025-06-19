-- Add metadata column to interactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'interactions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.interactions 
        ADD COLUMN metadata JSONB;
        
        COMMENT ON COLUMN public.interactions.metadata IS 'Additional metadata for the interaction, stored as JSONB for flexibility';
    END IF;
END $$;
