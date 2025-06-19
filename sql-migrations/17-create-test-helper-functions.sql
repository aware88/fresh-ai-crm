-- SQL migration to create helper functions for testing
-- These functions help with schema inspection and RLS verification

-- Function to get columns for a table
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public' AND
    c.table_name = get_table_columns.table_name;
END;
$$;

-- Function to check if RLS is enabled for a table
CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE oid = (table_name::regclass)::oid;
  
  RETURN rls_enabled;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_enabled TO authenticated;
