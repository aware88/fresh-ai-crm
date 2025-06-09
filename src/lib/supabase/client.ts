import { createClient } from '@supabase/supabase-js';

// We're deliberately avoiding authentication to prevent the freezing issues
// that were present in the original Next.js 15.3.3 + Supabase auth project

// Create a single supabase client for interacting with your database
export const createSupabaseClient = () => {
  // These environment variables will need to be set in .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Export a client-safe version that only creates the client on the client-side
export const clientSupabase = () => {
  if (typeof window === 'undefined') {
    return null; // Return null on the server side
  }
  
  return createSupabaseClient();
};
