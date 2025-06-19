-- SQL migration to create a function for executing arbitrary SQL
-- This is useful for running migrations and tests

-- Function to execute arbitrary SQL (admin only)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Restrict access to this function to only service_role
REVOKE ALL ON FUNCTION public.exec_sql FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql FROM authenticated;
REVOKE ALL ON FUNCTION public.exec_sql FROM anon;

COMMENT ON FUNCTION public.exec_sql IS 'Admin-only function to execute arbitrary SQL. Use with caution!';
