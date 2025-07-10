/**
 * Supabase Client Utility
 * 
 * This provides a consistent way to access Supabase from client components
 */
import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

export function resetSupabaseClient() {
  supabaseClient = null;
}

/**
 * Client-side function to get the current user's data
 */
export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

/**
 * Client-side function to get the current session
 */
export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  return session;
}

/**
 * Default Supabase client export for convenience
 */
export default getSupabaseClient();
