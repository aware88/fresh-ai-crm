-- Simple function to extract first name from email (basic implementation)
CREATE OR REPLACE FUNCTION public.extract_first_name(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  local_part TEXT;
  name_part TEXT;
BEGIN
  -- Extract the part before @
  local_part := SPLIT_PART(LOWER(p_email), '@', 1);
  
  -- Take the first part before any dots, underscores, or numbers
  name_part := REGEXP_REPLACE(local_part, '[._0-9].*$', '');
  
  -- Capitalize first letter
  IF LENGTH(name_part) > 0 THEN
    RETURN UPPER(SUBSTRING(name_part, 1, 1)) || SUBSTRING(name_part, 2);
  END IF;
  
  RETURN '';
END;
$$ LANGUAGE plpgsql;

-- Create or replace the store_email function with basic contact handling
CREATE OR REPLACE FUNCTION public.store_email(
  p_subject TEXT,
  p_sender TEXT,
  p_recipient TEXT,
  p_raw_content TEXT,
  p_analysis TEXT,
  p_contact_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_read BOOLEAN DEFAULT FALSE
) 
RETURNS SETOF emails
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id UUID;
  v_has_contact_access BOOLEAN;
  v_analysis_json JSONB;
  v_personality_type TEXT;
  v_contact_exists BOOLEAN;
  v_first_name TEXT;
  v_current_user_id UUID;
  v_email_id UUID;
  v_contact_email TEXT;
  v_emails_has_user_id BOOLEAN;
BEGIN
  -- Set the current user ID (use provided or fall back to auth.uid() if available)
  BEGIN
    v_current_user_id := COALESCE(p_user_id, auth.uid());
  EXCEPTION WHEN OTHERS THEN
    v_current_user_id := p_user_id; -- Fall back to provided user_id if auth.uid() fails
  END;
  
  -- Check if emails table has user_id column
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'emails' 
    AND column_name = 'user_id'
  ) INTO v_emails_has_user_id;
  
  -- Try to parse the analysis if it's a JSON string
  BEGIN
    v_analysis_json := p_analysis::JSONB;
    -- Try to extract personality type from the analysis
    v_personality_type := v_analysis_json->>'personality_type';
  EXCEPTION WHEN OTHERS THEN
    -- If parsing fails, store the raw analysis
    v_analysis_json := jsonb_build_object('raw_analysis', p_analysis);
    v_personality_type := NULL;
  END;
  
  -- Use the provided contact_id if available
  IF p_contact_id IS NOT NULL THEN
    -- Verify the user has access to the contact
    SELECT EXISTS (
      SELECT 1 FROM contacts 
      WHERE id = p_contact_id 
      AND (user_id = v_current_user_id OR user_id IS NULL)
    ) INTO v_has_contact_access;
    
    IF v_has_contact_access THEN
      v_contact_id := p_contact_id;
      
      -- Update the contact's last_contact timestamp
      UPDATE contacts 
      SET last_contact = NOW(),
          updated_at = NOW()
      WHERE id = v_contact_id;
    ELSE
      RAISE WARNING 'User % not authorized to link to contact %', v_current_user_id, p_contact_id;
    END IF;
  END IF;
  
  -- If we don't have a contact_id yet, try to find or create a contact
  IF v_contact_id IS NULL AND p_sender IS NOT NULL AND v_current_user_id IS NOT NULL THEN
    -- Check if a contact with this email already exists for this user
    SELECT id, email INTO v_contact_id, v_contact_email
    FROM contacts 
    WHERE LOWER(email) = LOWER(p_sender)
    AND (user_id = v_current_user_id OR user_id IS NULL)
    LIMIT 1;
    
    IF v_contact_id IS NOT NULL THEN
      -- Update existing contact's last_contact timestamp
      UPDATE contacts 
      SET last_contact = NOW(),
          updated_at = NOW()
      WHERE id = v_contact_id;
    ELSE
      -- Create new contact with basic info
      v_first_name := public.extract_first_name(p_sender);
      
      INSERT INTO contacts (
        id,
        first_name,
        email,
        user_id,
        created_at,
        updated_at,
        last_contact,
        personality_type,
        personality_analysis
      ) VALUES (
        gen_random_uuid(),
        v_first_name,
        p_sender,
        v_current_user_id,
        NOW(),
        NOW(),
        NOW(),
        v_personality_type,
        v_analysis_json
      )
      RETURNING id INTO v_contact_id;
      
      RAISE NOTICE 'Created new contact % for email %', v_contact_id, p_sender;
    END IF;
  END IF;
  
  -- If a contact_id was explicitly provided, use that instead
  IF p_contact_id IS NOT NULL THEN
    -- Verify the user has access to the contact
    SELECT EXISTS (
      SELECT 1 FROM contacts 
      WHERE id = p_contact_id 
      AND user_id = v_current_user_id
    ) INTO v_has_contact_access;
    
    IF NOT v_has_contact_access THEN
      RAISE WARNING 'User % not authorized to link to contact %', v_current_user_id, p_contact_id;
    ELSE
      v_contact_id := p_contact_id;
      
      -- Update the contact's last_contact timestamp
      UPDATE contacts 
      SET last_contact = NOW(),
          updated_at = NOW()
      WHERE id = v_contact_id;
    END IF;
  END IF;
  
  -- Insert the email, handling both cases where user_id column exists or not
  IF v_emails_has_user_id THEN
    -- Insert with user_id if the column exists
    RETURN QUERY
    INSERT INTO emails (
      subject,
      sender,
      recipient,
      raw_content,
      analysis,
      contact_id,
      user_id,
      "read",
      created_at,
      updated_at
    ) VALUES (
      p_subject,
      p_sender,
      p_recipient,
      p_raw_content,
      v_analysis_json,
      v_contact_id,
      v_current_user_id,
      COALESCE(p_read, false),
      NOW(),
      NOW()
    )
    RETURNING *;
  ELSE
    -- Insert without user_id if the column doesn't exist
    RETURN QUERY
    INSERT INTO emails (
      subject,
      sender,
      recipient,
      raw_content,
      analysis,
      contact_id,
      "read",
      created_at,
      updated_at
    ) VALUES (
      p_subject,
      p_sender,
      p_recipient,
      p_raw_content,
      v_analysis_json,
      v_contact_id,
      COALESCE(p_read, false),
      NOW(),
      NOW()
    )
    RETURNING *;
  END IF;
  
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the entire operation
    RAISE WARNING 'Error in store_email: %', SQLERRM;
    
    -- Still try to insert the email without contact association
    RETURN QUERY
    INSERT INTO emails (
      subject,
      sender,
      recipient,
      raw_content,
      analysis,
      user_id,
      read,
      created_at,
      updated_at
    ) VALUES (
      p_subject,
      p_sender,
      p_recipient,
      p_raw_content,
      v_analysis_json,
      v_current_user_id,
      COALESCE(p_read, false),
      NOW(),
      NOW()
    )
    RETURNING *;
END;
$$;

-- Update the function permissions
GRANT EXECUTE ON FUNCTION public.store_email(
  TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, BOOLEAN
) TO authenticated;

-- Grant execute on the helper function
GRANT EXECUTE ON FUNCTION public.extract_first_name(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.store_email IS 'Stores an email and automatically creates/updates the associated contact';
COMMENT ON FUNCTION public.extract_first_name IS 'Helper function to extract first name from an email address';
