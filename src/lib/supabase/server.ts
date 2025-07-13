import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Create a Supabase client for use in server-side code
 * This version works in both app/ directory and pages/ directory
 */
export const createServerClient = () => {
  // Simple direct client creation without cookie integration
  // This approach works in both app/ directory and pages/ directory contexts
  return supabaseCreateClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

/**
 * Export aliases to createServerClient for backward compatibility
 * This ensures existing imports continue to work
 */
export const createClient = createServerClient;
export const createServerSupabaseClient = createServerClient;

/**
 * Helper to extract cookies from various contexts
 * For compatibility with server actions, API routes, etc.
 */
export const getSupabaseServerCookies = (req: any) => {
  // If req has cookies property (like in API routes), use it
  if (req?.cookies) {
    return req.cookies;
  }
  
  // For other contexts, return empty implementation
  return {
    get: (name: string) => undefined,
    set: (name: string, value: string, options: CookieOptions) => {},
    remove: (name: string, options: CookieOptions) => {}
  };
};
