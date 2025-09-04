-- Add Real-time Sync Columns to email_accounts table
-- This migration adds columns to track real-time sync status and webhook configuration

-- Add new columns to email_accounts table
ALTER TABLE public.email_accounts 
ADD COLUMN IF NOT EXISTS real_time_sync_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webhook_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS polling_interval INTEGER DEFAULT 5, -- minutes
ADD COLUMN IF NOT EXISTS ai_processing_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS draft_preparation_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS sync_error_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMPTZ;

-- Add comments to document the new columns
COMMENT ON COLUMN public.email_accounts.real_time_sync_active IS 'Whether real-time email synchronization is currently active for this account';
COMMENT ON COLUMN public.email_accounts.webhook_id IS 'ID of the registered webhook for push notifications (Microsoft Graph, Gmail)';
COMMENT ON COLUMN public.email_accounts.webhook_active IS 'Whether the webhook is currently active and receiving notifications';
COMMENT ON COLUMN public.email_accounts.polling_interval IS 'Polling interval in minutes for IMAP or fallback sync';
COMMENT ON COLUMN public.email_accounts.ai_processing_enabled IS 'Whether to automatically process new emails with AI analysis';
COMMENT ON COLUMN public.email_accounts.draft_preparation_enabled IS 'Whether to automatically prepare draft responses for new emails';
COMMENT ON COLUMN public.email_accounts.sync_error IS 'Last sync error message, if any';
COMMENT ON COLUMN public.email_accounts.sync_error_count IS 'Number of consecutive sync errors (resets on success)';
COMMENT ON COLUMN public.email_accounts.last_successful_sync_at IS 'Timestamp of last successful email synchronization';

-- Create index for efficient querying of active sync accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_realtime_sync 
ON public.email_accounts(real_time_sync_active, is_active) 
WHERE real_time_sync_active = TRUE AND is_active = TRUE;

-- Create index for webhook management
CREATE INDEX IF NOT EXISTS idx_email_accounts_webhooks
ON public.email_accounts(webhook_active, provider_type)
WHERE webhook_active = TRUE;

-- Update existing accounts to have default values
UPDATE public.email_accounts 
SET 
  real_time_sync_active = FALSE,
  webhook_active = FALSE,
  polling_interval = CASE 
    WHEN provider_type IN ('microsoft', 'outlook') THEN 5
    WHEN provider_type IN ('google', 'gmail') THEN 3
    WHEN provider_type = 'imap' THEN 2
    ELSE 5
  END,
  ai_processing_enabled = TRUE,
  draft_preparation_enabled = TRUE,
  sync_error_count = 0
WHERE 
  real_time_sync_active IS NULL 
  OR polling_interval IS NULL;

-- Add a function to automatically set optimal polling intervals
CREATE OR REPLACE FUNCTION set_optimal_polling_interval()
RETURNS TRIGGER AS $$
BEGIN
  -- Set polling interval based on provider type if not explicitly set
  IF NEW.polling_interval IS NULL THEN
    NEW.polling_interval := CASE 
      WHEN NEW.provider_type IN ('microsoft', 'outlook') THEN 5  -- 5 minutes (has webhooks)
      WHEN NEW.provider_type IN ('google', 'gmail') THEN 3       -- 3 minutes (has push)
      WHEN NEW.provider_type = 'imap' THEN 2                     -- 2 minutes (polling only)
      ELSE 5
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set polling intervals for new accounts
DROP TRIGGER IF EXISTS trigger_set_polling_interval ON public.email_accounts;
CREATE TRIGGER trigger_set_polling_interval
  BEFORE INSERT OR UPDATE ON public.email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_optimal_polling_interval();

-- Add validation to ensure sync settings are consistent
ALTER TABLE public.email_accounts 
ADD CONSTRAINT check_sync_consistency 
CHECK (
  (real_time_sync_active = FALSE) OR 
  (real_time_sync_active = TRUE AND is_active = TRUE)
);

-- Log the migration completion
SELECT 'Real-time sync columns added to email_accounts table' as migration_status;


