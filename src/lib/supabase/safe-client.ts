/**
 * Safe Supabase Client for Client-Side Components
 * 
 * This module provides a safe way to initialize the Supabase client in client components
 * without causing build-time execution of server-only code.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with error handling for client-side components
 */
export function createSafeClient(): SupabaseClient {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('createSafeClient should only be called in client components');
  }

  try {
    // For client-side, we can use environment variables prefixed with NEXT_PUBLIC_
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase environment variables are missing. Using mock client.');
      // Return a mock client with similar interface but no actual functionality
      return createMockClient();
    }

    return createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Return a mock client to prevent app crashes
    return createMockClient();
  }
}

/**
 * Creates a mock Supabase client that won't cause runtime errors
 * when real credentials are unavailable
 */
function createMockClient(): SupabaseClient {
  const mockResponse = { data: null, error: { message: 'Mock client used - no actual database connection' } };
  const mockAuthResponse = { data: { user: null, session: null }, error: null };
  
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(mockResponse),
          order: () => ({
            range: () => Promise.resolve(mockResponse),
          }),
          limit: () => Promise.resolve(mockResponse),
        }),
        order: () => ({
          range: () => Promise.resolve(mockResponse),
        }),
        match: () => ({
          limit: () => Promise.resolve(mockResponse),
        }),
        limit: () => Promise.resolve(mockResponse),
        range: () => Promise.resolve(mockResponse),
      }),
      insert: () => Promise.resolve(mockResponse),
      update: () => ({
        eq: () => Promise.resolve(mockResponse),
        match: () => Promise.resolve(mockResponse),
      }),
      delete: () => ({
        eq: () => Promise.resolve(mockResponse),
        match: () => Promise.resolve(mockResponse),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve(mockAuthResponse),
      signOut: () => Promise.resolve(mockAuthResponse),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as unknown as SupabaseClient;
}
