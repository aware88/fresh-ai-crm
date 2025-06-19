-- Fix duplicate triggers and update set_created_by function

-- Drop the duplicate trigger
DROP TRIGGER IF EXISTS ensure_created_by ON public.interactions;

-- Update the set_created_by function to be more explicit about auth requirements
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $function$
BEGIN
  -- Only set created_by if it's NULL
  IF NEW.created_by IS NULL THEN
    -- Require auth.uid() to be set - don't fall back to a default
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the remaining trigger with a clear name
DROP TRIGGER IF EXISTS set_interactions_created_by ON public.interactions;

CREATE TRIGGER set_interactions_created_by
BEFORE INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Verify the changes
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  event_object_table = 'interactions';

-- Show the updated function definition
SELECT pg_get_functiondef('public.set_created_by()'::regprocedure) as function_definition;
