-- Migration: Add tags to Metakocka error logs
-- Description: Adds a tags column to the Metakocka error logs table for better categorization

BEGIN;

-- Add tags column to Metakocka error logs (if not already added during table creation)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'metakocka_integration_logs' AND column_name = 'tags') THEN
    ALTER TABLE metakocka_integration_logs
      ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];
  END IF;
END $$;

-- Add index for faster tag-based searches
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_tags ON metakocka_integration_logs USING GIN (tags);

COMMIT;
