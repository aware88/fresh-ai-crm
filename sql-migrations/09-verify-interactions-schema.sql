-- Verify the complete schema of the interactions table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'interactions'
ORDER BY 
    ordinal_position;
