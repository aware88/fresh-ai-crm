-- Migration: Add tags to Metakocka error logs
-- Description: Adds a tags column to the Metakocka error logs table for better categorization

BEGIN;

-- Add tags column to Metakocka error logs
ALTER TABLE metakocka_integration_logs
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- Add index for faster tag-based searches
CREATE INDEX IF NOT EXISTS idx_metakocka_integration_logs_tags ON metakocka_integration_logs USING GIN (tags);

COMMIT;
