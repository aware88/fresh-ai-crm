import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import type { CookieOptions } from '@supabase/ssr';

/**
 * Create a Supabase client for use in server-side code
 * This version works in both app/ directory and pages/ directory
 */
export const createServerClient = () => {
  // Check for build environment
  const isBuildEnv = process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build';
  
  // Create mock client for environments with missing variables
  const createMockClient = () => {
    // During build, we want to avoid warning logs that might cause confusion
    if (!isBuildEnv) {
      console.warn('Using Supabase mock client due to missing environment variables.');
    }
    
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: (table: string) => ({
        select: (columns: string = '*', options?: any) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            range: (start: number, end: number) => Promise.resolve({ data: [], error: null, count: 0 }),
            gte: (column: string, value: any) => ({
              lte: (column: string, value: any) => Promise.resolve({ data: [], error: null, count: 0 })
            }),
          }),
          order: (column: string, options?: any) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null }),
            range: (start: number, end: number) => Promise.resolve({ data: [], error: null, count: 0 })
          }),
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null, count: 0 }),
          gte: (column: string, value: any) => ({
            lte: (column: string, value: any) => Promise.resolve({ data: [], error: null, count: 0 })
          }),
        }),
        insert: (data: any) => ({
          select: (columns: string = '*') => ({
            single: () => Promise.resolve({ data: { id: 'mock-id' }, error: null }),
          }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: (columns: string = '*') => ({
              single: () => Promise.resolve({ data: { id: value }, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
      storage: {
        from: (bucket: string) => ({
          upload: (path: string, data: any) => Promise.resolve({ data: { path }, error: null }),
          getPublicUrl: (path: string) => ({ data: { publicUrl: `mock-url/${path}` } }),
        }),
      },
      rpc: (functionName: string, params?: Record<string, any>) => {
        // Special handling for audit log functions
        if (functionName === 'log_audit_event' && params) {
          // Mock a UUID as the result
          return Promise.resolve({ data: 'mock-audit-log-uuid', error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
    } as any;
  };

  // Always use mock client during build phase to prevent build errors
  if (isBuildEnv) {
    return createMockClient();
  }

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createMockClient();
  }
  
  // Create real client when environment variables are available and not in build phase
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
