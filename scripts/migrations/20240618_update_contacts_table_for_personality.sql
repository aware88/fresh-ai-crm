-- Add columns for personality analysis tracking
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS "personalityanalysis" JSONB,
ADD COLUMN IF NOT EXISTS "personalityhistory" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "personalitylastupdated" TIMESTAMP WITH TIME ZONE;

-- Create index on the new columns for better query performance
CREATE INDEX IF NOT EXISTS contacts_personality_analysis_idx 
ON public.contacts USING GIN ("personalityanalysis");

-- Create a function to update the personality history
CREATE OR REPLACE FUNCTION update_personality_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if personalitytype has changed
  IF NEW.personalitytype IS DISTINCT FROM OLD.personalitytype THEN
    -- Initialize history if it doesn't exist
    IF NEW.personalityhistory IS NULL THEN
      NEW.personalityhistory = '[]'::jsonb;
    END IF;
    
    -- Add the old personality type to history if it exists
    IF OLD.personalitytype IS NOT NULL THEN
      NEW.personalityhistory = 
        NEW.personalityhistory || 
        jsonb_build_object(
          'type', OLD.personalitytype,
          'analysis', OLD.personalityanalysis,
          'updatedAt', OLD.personalitylastupdated
        )::jsonb;
    END IF;
    
    -- Update the last updated timestamp
    NEW.personalitylastupdated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the history
DROP TRIGGER IF EXISTS update_personality_history_trigger ON public.contacts;
CREATE TRIGGER update_personality_history_trigger
BEFORE UPDATE OF personalitytype ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION update_personality_history();

-- Update RLS policies to include new columns
-- (Assuming RLS is already enabled)

-- Grant permissions on the updated table
GRANT SELECT, INSERT, UPDATE ON public.contacts TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.contacts.personalityanalysis IS 'Structured personality analysis data in JSON format';
COMMENT ON COLUMN public.contacts.personalityhistory IS 'Array of previous personality types and analyses';
COMMENT ON COLUMN public.contacts.personalitylastupdated IS 'Timestamp when the personality type was last updated';
