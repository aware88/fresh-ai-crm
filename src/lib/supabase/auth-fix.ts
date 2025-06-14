import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with auth disabled to prevent refresh token errors
 * This is a workaround for the "Invalid Refresh Token" errors
 */
export const createNoAuthClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables');
    return null;
  }
  
  try {
    // Create client with auth disabled and persistSession set to false
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};
