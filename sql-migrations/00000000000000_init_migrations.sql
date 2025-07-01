-- Create migrations table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_migrations_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create index for faster lookups
  CREATE INDEX IF NOT EXISTS idx_migrations_name ON public.migrations(name);
  
  -- Grant necessary permissions
  GRANT SELECT, INSERT ON public.migrations TO authenticated;
  GRANT USAGE, SELECT ON SEQUENCE public.migrations_id_seq TO authenticated;
END;
$$;

-- Helper function to check and create migrations table if needed
CREATE OR REPLACE FUNCTION public.create_migrations_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will fail if the table doesn't exist
  PERFORM 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'migrations';
  
  -- If we get here, the table exists
  RETURN;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, create it
  PERFORM public.create_migrations_table();
END;
$$;

-- Function to execute SQL safely
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_migrations_table() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_migrations_table_if_not_exists() TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO service_role;
