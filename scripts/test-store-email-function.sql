-- Test script for the store_email function with contact handling

-- First, create a test user if it doesn't exist
DO $$
DECLARE
  -- Main variables
  test_user_id UUID;
  v_contact_id TEXT;  -- Contacts table uses TEXT for ID, not UUID
  v_first_name TEXT;
  v_last_name TEXT;
  v_contact_email TEXT;
  v_created_at TIMESTAMP WITH TIME ZONE;
  v_lastcontact TIMESTAMP WITH TIME ZONE;
  v_last_contact_updated TIMESTAMP WITH TIME ZONE;
  
  -- Loop variables
  contact_rec RECORD;
  email_rec RECORD;
BEGIN
  -- Check if test user already exists
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com';
  
  IF test_user_id IS NULL THEN
    -- Create a test user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'test@example.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Created test user with ID: %', test_user_id;
  ELSE
    RAISE NOTICE 'Using existing test user with ID: %', test_user_id;
    
    -- Clean up any existing test data
    DELETE FROM emails 
    WHERE sender = 'new.contact@example.com' 
    OR recipient = 'test@example.com';
    
    -- Delete contacts by email since we don't have their IDs yet
    DELETE FROM contacts 
    WHERE email = 'new.contact@example.com' 
    OR email = 'another.email@example.com';
  END IF;
  
  -- Test 1: Store email with a new contact
  RAISE NOTICE '\n--- Test 1: Store email with new contact ---';
  BEGIN
    PERFORM * FROM store_email(
      'Test Email 1',
      'new.contact@example.com',
      'test@example.com',
      'This is a test email',
      '{"personality_type": "Analytical", "summary": "Test summary"}',
      NULL, -- contact_id
      test_user_id,
      false
    );
    RAISE NOTICE '✅ Test 1: Successfully stored email with new contact';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Test 1 failed: %', SQLERRM;
  END;
  
  -- Verify contact was created with the correct name
  SELECT id, firstname, lastname, email, createdat, lastcontact 
  INTO v_contact_id, v_first_name, v_last_name, v_contact_email, v_created_at, v_lastcontact
  FROM contacts 
  WHERE email = 'new.contact@example.com'
  LIMIT 1;
  
  IF v_contact_id IS NOT NULL THEN
    RAISE NOTICE 'Contact found: % % (ID: %), Created: %, Last Contact: %', 
      v_first_name, v_last_name, v_contact_id, v_created_at, v_lastcontact;
    RAISE NOTICE '✅ Contact created: % % (%)', v_first_name, v_last_name, v_contact_email;
  ELSE
    RAISE WARNING '❌ Contact was not created';
  END IF;
  
  -- Test 2: Store another email with the same sender (should update existing contact)
  RAISE NOTICE '\n--- Test 2: Store email with existing contact ---';
  BEGIN
    PERFORM * FROM store_email(
      'Test Email 2',
      'new.contact@example.com',
      'test@example.com',
      'This is another test email',
      '{"personality_type": "Analytical", "summary": "Updated summary"}',
      NULL, -- contact_id
      test_user_id,
      true
    );
    RAISE NOTICE '✅ Test 2: Successfully stored email with existing contact';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Test 2 failed: %', SQLERRM;
  END;
  
  -- Get the current last_contact timestamp if contact exists
  SELECT lastcontact INTO v_lastcontact
  FROM contacts 
  WHERE id = v_contact_id;
  
  -- Verify contact was updated
  SELECT lastcontact INTO v_last_contact_updated
  FROM contacts 
  WHERE id = v_contact_id;
  
  IF v_last_contact_updated > v_lastcontact THEN
    RAISE NOTICE '✅ Contact last_contact updated: %', v_last_contact_updated;
  ELSE
    RAISE WARNING '❌ Contact last_contact was not updated';
  END IF;
  
  -- Test 3: Store email with explicit contact_id
  RAISE NOTICE '\n--- Test 3: Store email with explicit contact_id ---';
  BEGIN
    -- Debug the contact ID type
    RAISE NOTICE 'Contact ID before store_email call: % (type: %)', v_contact_id, pg_typeof(v_contact_id);
    
    PERFORM * FROM store_email(
      'Test Email 3',
      'another.email@example.com',
      'test@example.com',
      'This is a test with explicit contact_id',
      '{"personality_type": "Driver", "summary": "Direct and to the point"}',
      v_contact_id::UUID, -- Need to cast TEXT to UUID for the function parameter
      test_user_id,
      false
    );
    RAISE NOTICE '✅ Test 3: Successfully stored email with explicit contact_id';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Test 3 failed: %', SQLERRM;
  END;
  
  -- Show results
  RAISE NOTICE '\n--- Results ---';
  
  -- Show contacts
  RAISE NOTICE '\nContacts created/updated:';
  FOR contact_rec IN 
    SELECT id, firstname, lastname, email, createdat, lastcontact 
    FROM contacts 
    WHERE email = 'new.contact@example.com' 
    OR email = 'another.email@example.com'
  LOOP
    RAISE NOTICE 'Contact: % % (ID: %), Email: %, Created: %, Last Contact: %', 
      contact_rec.firstname, contact_rec.lastname, contact_rec.id, 
      contact_rec.email, contact_rec.createdat, contact_rec.lastcontact;
  END LOOP;
  
  -- Show emails
  RAISE NOTICE '\nEmails stored:';
  FOR email_rec IN 
    SELECT id, subject, sender, recipient, created_at 
    FROM emails 
    WHERE (sender = 'new.contact@example.com' OR recipient = 'test@example.com')
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Email: % - From: % - To: % - Created: %', 
      email_rec.subject, 
      email_rec.sender, 
      email_rec.recipient,
      email_rec.created_at;
  END LOOP;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Test failed: % (at line %) - Contact ID type: %', SQLERRM, pg_exception_context(), pg_typeof(v_contact_id);
END $$;
