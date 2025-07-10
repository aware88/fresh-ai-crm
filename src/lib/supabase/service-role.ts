import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

/**
 * Create a Supabase client with service role credentials
 * This bypasses RLS policies and should only be used in secure server contexts
 */
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};
