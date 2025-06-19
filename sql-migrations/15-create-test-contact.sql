-- Create a test contact for interactions testing
DO $$
DECLARE
    test_contact_id TEXT := 'test-contact-' || gen_random_uuid();
BEGIN
    -- First check if our test contact already exists
    IF NOT EXISTS (SELECT 1 FROM public.contacts WHERE id LIKE 'test-contact-%') THEN
        -- Insert a test contact with fields that match the actual schema
        INSERT INTO public.contacts (
            id, 
            firstname, 
            lastname, 
            email,
            phone,
            company,
            position,
            personalitytype,
            notes,
            status
        ) VALUES (
            test_contact_id,
            'Test',
            'Contact',
            'test@example.com',
            '555-123-4567',
            'Test Company',
            'Test Position',
            'INFJ',
            'This is a test contact for interactions testing',
            'active'
        );
        
        RAISE NOTICE 'Created test contact with ID: %', test_contact_id;
    ELSE
        SELECT id INTO test_contact_id FROM public.contacts WHERE id LIKE 'test-contact-%' LIMIT 1;
        RAISE NOTICE 'Using existing test contact with ID: %', test_contact_id;
    END IF;
    
    -- Output the test contact ID for use in scripts
    RAISE NOTICE 'TEST_CONTACT_ID=%', test_contact_id;
END $$;
