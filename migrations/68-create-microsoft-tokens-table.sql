-- Migration: Create Microsoft Tokens Table
-- Description: Creates a table to store Microsoft Graph access and refresh tokens

-- Create the microsoft_tokens table
CREATE TABLE IF NOT EXISTS microsoft_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE microsoft_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own tokens
CREATE POLICY "Users can view their own tokens" 
  ON microsoft_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
  ON microsoft_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON microsoft_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
  ON microsoft_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON microsoft_tokens TO authenticated;

-- Grant permissions to service_role
GRANT ALL ON microsoft_tokens TO service_role;
