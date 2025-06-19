-- Query to get the test contact ID
SELECT id FROM public.contacts 
WHERE id LIKE 'test-contact-%' 
ORDER BY createdat DESC 
LIMIT 1;
