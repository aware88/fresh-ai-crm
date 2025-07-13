/**
 * Supabase Client Utility
 * 
 * This provides a consistent way to access Supabase from client components
 */
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof supabaseCreateClient> | null = null;

// Check if we're in build environment
const isBuildEnv = () => {
  return process.env.NODE_ENV === 'production' && 
         typeof window === 'undefined' && 
         (process.env.NEXT_PHASE === 'phase-production-build' || 
          process.env.NEXT_PHASE === 'phase-production-server');
};

// Create mock client for build-time or missing env vars
const createMockClient = () => {
  if (!isBuildEnv()) {
    console.warn('Using Supabase mock client due to missing environment variables.');
  }
  
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock client - authentication not available' } }),
    },
    from: (table: string) => ({
      select: (columns: string = '*', options?: any) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null, count: 0 }),
        }),
        order: (column: string, options?: any) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null }),
          range: (start: number, end: number) => Promise.resolve({ data: [], error: null, count: 0 })
        }),
        limit: (limit: number) => Promise.resolve({ data: [], error: null }),
        range: (start: number, end: number) => Promise.resolve({ data: [], error: null, count: 0 }),
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
      return Promise.resolve({ data: null, error: null });
    },
  } as any;
};

export function getSupabaseClient() {
  if (!supabaseClient) {
    // Always use mock client during build phase
    if (isBuildEnv()) {
      supabaseClient = createMockClient();
      return supabaseClient;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Use mock client if environment variables are missing
    if (!supabaseUrl || !supabaseAnonKey) {
      supabaseClient = createMockClient();
      return supabaseClient;
    }

    try {
      supabaseClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      supabaseClient = createMockClient();
    }
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
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Client-side function to get the current session
 */
export async function getCurrentSession() {
  try {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data: { session } } = await client.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Export createClient as an alias to getSupabaseClient for backward compatibility
 * This ensures existing imports of createClient continue to work
 */
export const createClient = getSupabaseClient;

/**
 * Default Supabase client export for convenience
 * Note: This creates the client immediately, so it will use build-time detection
 */
export default getSupabaseClient();
