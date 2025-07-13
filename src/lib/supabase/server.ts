import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Create a Supabase client for use in server-side code
 * This version works in both app/ directory and pages/ directory
 */
export const createServerClient = () => {
  // Create mock client for environments with missing variables
  const createMockClient = () => {
    console.warn('Using Supabase mock client due to missing environment variables.');
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: (table: string) => ({
        select: (columns: string = '*') => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      storage: {
        from: (bucket: string) => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as any;
  };

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createMockClient();
  }
  
  // Create real client when environment variables are available
  try {
    return supabaseCreateClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return createMockClient();
  }
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
