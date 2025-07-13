import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Create a Supabase client for use in server-side code
 * This version works in both app/ directory and pages/ directory
 */
export const createServerClient = () => {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // In development, provide mock client with empty implementation
    if (process.env.NODE_ENV === 'development') {
      console.warn('Missing Supabase environment variables in development mode. Using mock client.');
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as any;
    }
    
    // In production, throw an error
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create real client when environment variables are available
  return supabaseCreateClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
