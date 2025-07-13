import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

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

// Create a custom hook to use Supabase client
export function useSupabase() {
  const [supabaseClient] = useState(() => {
    // Always use mock client during build phase
    if (isBuildEnv()) {
      return createMockClient();
    }

    // Use mock client if environment variables are missing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return createMockClient();
    }
    
    try {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return createMockClient();
    }
  });

  return { supabase: supabaseClient };
}

// Re-export the client for direct imports
export { supabase } from './client';
