-- Create a function to execute SQL queries from the client
-- This is useful for running raw SQL queries from the client
-- Note: This function should be restricted to admin users in production

-- Check if the function already exists and drop it if it does
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Create the function
CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
  result_jsonb JSONB;
  result_text TEXT;
  result_bool BOOLEAN;
  result_exists BOOLEAN;
  query_type TEXT;
  result_set REFCURSOR;
  row_data RECORD;
  json_rows JSONB := '[]'::JSONB;
  col_name TEXT;
  col_value JSONB;
BEGIN
  -- Determine the type of query (SELECT, EXISTS, etc.)
  query_type := upper(substring(trim(sql_string) from 1 for 6));
  
  -- Handle EXISTS queries specially
  IF position('EXISTS' in upper(sql_string)) > 0 THEN
    EXECUTE sql_string INTO result_exists;
    RETURN jsonb_build_array(jsonb_build_object('exists', result_exists));
  -- Handle SELECT queries
  ELSIF query_type = 'SELECT' THEN
    BEGIN
      -- Try to execute as a result set and convert to JSONB array
      OPEN result_set FOR EXECUTE sql_string;
      LOOP
        FETCH result_set INTO row_data;
        EXIT WHEN NOT FOUND;
        
        -- Convert each row to JSONB
        DECLARE
          row_jsonb JSONB := '{}'::JSONB;
        BEGIN
          FOR col_name, col_value IN SELECT key, value FROM jsonb_each(to_jsonb(row_data)) LOOP
            row_jsonb := row_jsonb || jsonb_build_object(col_name, col_value);
          END LOOP;
          json_rows := json_rows || row_jsonb;
        END;
      END LOOP;
      CLOSE result_set;
      
      -- Return the array of rows
      RETURN json_rows;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        -- Try to execute as a single value
        EXECUTE sql_string INTO result_bool;
        RETURN to_jsonb(result_bool);
      EXCEPTION WHEN OTHERS THEN
        BEGIN
          -- Try to execute as text result
          EXECUTE sql_string INTO result_text;
          RETURN to_jsonb(result_text);
        EXCEPTION WHEN OTHERS THEN
          BEGIN
            -- Try to execute as record result
            EXECUTE sql_string INTO result_record;
            RETURN to_jsonb(result_record);
          EXCEPTION WHEN OTHERS THEN
            -- Last resort: return the error
            RETURN jsonb_build_array(
              jsonb_build_object(
                'error', SQLERRM,
                'detail', SQLSTATE
              )
            );
          END;
        END;
      END;
    END;
  ELSE
    -- For non-SELECT queries, execute without returning results
    EXECUTE sql_string;
    RETURN jsonb_build_array(jsonb_build_object('success', true));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_array(
    jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
-- In production, you might want to restrict this to admin users only
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Comment on the function
COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes a SQL query and returns the result as JSONB. Use with caution!';
