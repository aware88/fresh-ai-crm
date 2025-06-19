-- SQL script to directly test the interactions table schema
-- This bypasses RLS by using the service_role key

-- 1. Insert a test interaction
INSERT INTO public.interactions (
  id, 
  contact_id, 
  type, 
  title, 
  content, 
  interaction_date, 
  created_by, 
  metadata
) VALUES (
  'test-id-' || gen_random_uuid(), 
  'test-contact-123', 
  'email', 
  'Test Email', 
  'This is a test email interaction', 
  now(), 
  '0039ef8f-3fb0-4120-9514-8028522b9d4f', 
  '{"test": true, "priority": "high"}'::jsonb
) RETURNING *;

-- 2. Query the inserted interaction
SELECT * FROM public.interactions 
WHERE contact_id = 'test-contact-123' 
ORDER BY createdat DESC 
LIMIT 1;

-- 3. Update the interaction
UPDATE public.interactions 
SET title = 'Updated Test Email', 
    content = 'This is an updated test email interaction' 
WHERE contact_id = 'test-contact-123' 
AND type = 'email' 
RETURNING *;

-- 4. Delete the test interaction
DELETE FROM public.interactions 
WHERE contact_id = 'test-contact-123' 
AND type = 'email' 
RETURNING *;
