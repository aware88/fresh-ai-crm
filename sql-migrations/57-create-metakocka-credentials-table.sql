-- Migration: Create Metakocka credentials table
-- Description: Adds table to store Metakocka API credentials securely

BEGIN;

-- Create table for storing Metakocka API credentials
CREATE TABLE IF NOT EXISTS metakocka_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id VARCHAR(50) NOT NULL,
  secret_key VARCHAR(255) NOT NULL,
  api_endpoint VARCHAR(255) DEFAULT 'https://main.metakocka.si/rest/eshop/v1/json/',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE metakocka_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view and edit their own credentials
CREATE POLICY metakocka_credentials_user_policy ON metakocka_credentials
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE metakocka_credentials IS 'Stores API credentials for Metakocka integration';

-- Create index for faster lookups
CREATE INDEX idx_metakocka_credentials_user_id ON metakocka_credentials(user_id);

COMMIT;
