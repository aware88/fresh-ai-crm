-- Migration: Create two-factor authentication tables
-- Description: Adds tables and functions for TOTP-based two-factor authentication

-- Create two_factor_auth table to store user 2FA configurations
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,  -- Encrypted TOTP secret key
  backup_codes JSONB,        -- Encrypted backup recovery codes
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create two_factor_auth_attempts table to track failed attempts
CREATE TABLE IF NOT EXISTS two_factor_auth_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  is_successful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS two_factor_auth_user_id_idx ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS two_factor_auth_attempts_user_id_idx ON two_factor_auth_attempts(user_id);
CREATE INDEX IF NOT EXISTS two_factor_auth_attempts_created_at_idx ON two_factor_auth_attempts(created_at);

-- Enable Row Level Security
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can only view their own 2FA settings
CREATE POLICY two_factor_auth_select_policy ON two_factor_auth
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only update their own 2FA settings
CREATE POLICY two_factor_auth_update_policy ON two_factor_auth
  FOR UPDATE
  USING (user_id = auth.uid());

-- Only the system can insert 2FA settings
CREATE POLICY two_factor_auth_insert_policy ON two_factor_auth
  FOR INSERT
  WITH CHECK (auth.uid() = '00000000-0000-0000-0000-000000000000' OR user_id = auth.uid());

-- No one can delete 2FA settings directly
CREATE POLICY two_factor_auth_delete_policy ON two_factor_auth
  FOR DELETE
  USING (false);

-- Only the system can insert 2FA attempts
CREATE POLICY two_factor_auth_attempts_insert_policy ON two_factor_auth_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Users can only view their own 2FA attempts
CREATE POLICY two_factor_auth_attempts_select_policy ON two_factor_auth_attempts
  FOR SELECT
  USING (user_id = auth.uid());

-- System admins can view all 2FA attempts
CREATE POLICY two_factor_auth_attempts_select_admin_policy ON two_factor_auth_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- No one can update or delete 2FA attempts
CREATE POLICY two_factor_auth_attempts_update_policy ON two_factor_auth_attempts
  FOR UPDATE
  USING (false);

CREATE POLICY two_factor_auth_attempts_delete_policy ON two_factor_auth_attempts
  FOR DELETE
  USING (false);

-- Create function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_codes JSONB;
  v_code TEXT;
  i INT;
BEGIN
  v_codes := '[]'::JSONB;
  
  -- Generate 10 backup codes
  FOR i IN 1..10 LOOP
    -- Generate a random 8-character alphanumeric code
    v_code := substring(md5(random()::text) from 1 for 8);
    
    -- Add to the array
    v_codes := v_codes || jsonb_build_object(
      'code', v_code,
      'used', false
    );
  END LOOP;
  
  RETURN v_codes;
END;
$$;

-- Create function to enable 2FA for a user
CREATE OR REPLACE FUNCTION enable_two_factor_auth(
  p_user_id UUID,
  p_secret_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_backup_codes JSONB;
BEGIN
  -- Generate backup codes
  v_backup_codes := generate_backup_codes();
  
  -- Check if the user already has 2FA configured
  SELECT id INTO v_id FROM two_factor_auth WHERE user_id = p_user_id;
  
  IF v_id IS NULL THEN
    -- Insert new 2FA configuration
    INSERT INTO two_factor_auth(
      user_id,
      secret_key,
      backup_codes,
      is_enabled,
      is_verified
    ) VALUES (
      p_user_id,
      p_secret_key,
      v_backup_codes,
      false,  -- Not enabled until verified
      false   -- Not verified yet
    )
    RETURNING id INTO v_id;
  ELSE
    -- Update existing 2FA configuration
    UPDATE two_factor_auth
    SET 
      secret_key = p_secret_key,
      backup_codes = v_backup_codes,
      is_enabled = false,
      is_verified = false,
      updated_at = NOW()
    WHERE id = v_id;
  END IF;
  
  -- Log this action
  PERFORM log_audit_event(
    auth.uid(),
    NULL,
    'create',
    'two_factor_auth',
    p_user_id::TEXT,
    NULL,
    jsonb_build_object('user_id', p_user_id),
    jsonb_build_object('action', 'setup_initiated')
  );
  
  RETURN v_id;
END;
$$;

-- Create function to verify and enable 2FA
CREATE OR REPLACE FUNCTION verify_two_factor_auth(
  p_user_id UUID,
  p_is_successful BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Record the verification attempt
  INSERT INTO two_factor_auth_attempts(
    user_id,
    ip_address,
    user_agent,
    is_successful
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_is_successful
  );
  
  -- If successful, enable 2FA
  IF p_is_successful THEN
    UPDATE two_factor_auth
    SET 
      is_enabled = true,
      is_verified = true,
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_result := true;
    
    -- Log this action
    PERFORM log_audit_event(
      auth.uid(),
      NULL,
      'update',
      'two_factor_auth',
      p_user_id::TEXT,
      NULL,
      jsonb_build_object('is_enabled', true, 'is_verified', true),
      jsonb_build_object('action', 'enabled')
    );
  ELSE
    v_result := false;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create function to validate a backup code
CREATE OR REPLACE FUNCTION validate_backup_code(
  p_user_id UUID,
  p_backup_code TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_codes JSONB;
  v_index INT;
  v_is_valid BOOLEAN := false;
BEGIN
  -- Get the user's backup codes
  SELECT backup_codes INTO v_backup_codes
  FROM two_factor_auth
  WHERE user_id = p_user_id AND is_enabled = true;
  
  IF v_backup_codes IS NULL THEN
    -- No backup codes found or 2FA not enabled
    v_is_valid := false;
  ELSE
    -- Find the backup code
    FOR i IN 0..jsonb_array_length(v_backup_codes) - 1 LOOP
      IF v_backup_codes->i->>'code' = p_backup_code AND (v_backup_codes->i->>'used')::BOOLEAN = false THEN
        -- Valid backup code found
        v_index := i;
        v_is_valid := true;
        EXIT;
      END IF;
    END LOOP;
    
    -- If valid, mark the code as used
    IF v_is_valid THEN
      v_backup_codes := jsonb_set(
        v_backup_codes,
        ARRAY[v_index::text, 'used'],
        'true'::jsonb
      );
      
      UPDATE two_factor_auth
      SET 
        backup_codes = v_backup_codes,
        last_used_at = NOW(),
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- Record the attempt
  INSERT INTO two_factor_auth_attempts(
    user_id,
    ip_address,
    user_agent,
    is_successful
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    v_is_valid
  );
  
  -- Log this action
  IF v_is_valid THEN
    PERFORM log_audit_event(
      auth.uid(),
      NULL,
      'update',
      'two_factor_auth',
      p_user_id::TEXT,
      NULL,
      NULL,
      jsonb_build_object('action', 'backup_code_used')
    );
  END IF;
  
  RETURN v_is_valid;
END;
$$;

-- Create function to disable 2FA
CREATE OR REPLACE FUNCTION disable_two_factor_auth(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Disable 2FA for the user
  UPDATE two_factor_auth
  SET 
    is_enabled = false,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Check if the update was successful
  GET DIAGNOSTICS v_result = ROW_COUNT;
  
  -- Log this action
  IF v_result THEN
    PERFORM log_audit_event(
      auth.uid(),
      NULL,
      'update',
      'two_factor_auth',
      p_user_id::TEXT,
      jsonb_build_object('is_enabled', true),
      jsonb_build_object('is_enabled', false),
      jsonb_build_object('action', 'disabled')
    );
  END IF;
  
  RETURN v_result > 0;
END;
$$;

-- Create function to regenerate backup codes
CREATE OR REPLACE FUNCTION regenerate_backup_codes(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_backup_codes JSONB;
BEGIN
  -- Generate new backup codes
  v_backup_codes := generate_backup_codes();
  
  -- Update the user's backup codes
  UPDATE two_factor_auth
  SET 
    backup_codes = v_backup_codes,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log this action
  PERFORM log_audit_event(
    auth.uid(),
    NULL,
    'update',
    'two_factor_auth',
    p_user_id::TEXT,
    NULL,
    NULL,
    jsonb_build_object('action', 'backup_codes_regenerated')
  );
  
  RETURN v_backup_codes;
END;
$$;
