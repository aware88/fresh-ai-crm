-- Create or replace the store_email function that enforces RLS
CREATE OR REPLACE FUNCTION public.store_email(
  p_subject TEXT,
  p_sender TEXT,
  p_recipient TEXT,
  p_raw_content TEXT,
  p_analysis TEXT,
  p_contact_id UUID,
  p_user_id UUID,
  p_read BOOLEAN
) 
RETURNS SETOF emails
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_id UUID;
  v_contact_id UUID;
  v_has_contact_access BOOLEAN;
BEGIN
  -- Verify the user has access to the contact if contact_id is provided
  IF p_contact_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM contacts 
      WHERE id = p_contact_id 
      AND (user_id = p_user_id OR user_id IS NULL)
    ) INTO v_has_contact_access;
    
    IF NOT v_has_contact_access THEN
      RAISE EXCEPTION 'Not authorized to link to this contact';
    END IF;
    
    v_contact_id := p_contact_id;
  END IF;
  
  -- Insert the email with the verified parameters
  RETURN QUERY
  INSERT INTO emails (
    subject,
    sender,
    recipient,
    raw_content,
    analysis,
    contact_id,
    user_id,
    read,
    created_at,
    updated_at
  ) VALUES (
    p_subject,
    p_sender,
    p_recipient,
    p_raw_content,
    p_analysis,
    v_contact_id,
    p_user_id,
    COALESCE(p_read, false),
    NOW(),
    NOW()
  )
  RETURNING *;
  
  -- Update the contact's last_contact timestamp
  IF v_contact_id IS NOT NULL THEN
    UPDATE contacts 
    SET lastcontact = NOW(),
        updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;
  
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.store_email(
  TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, BOOLEAN
) TO authenticated;
