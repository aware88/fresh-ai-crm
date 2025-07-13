/**
 * Universal lazy-loading Supabase client factory
 * Prevents build-time Supabase client creation by deferring all imports
 * and client instantiation until runtime.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Build environment detection
const isBuildEnv = (): boolean => {
  return (
    process.env.NODE_ENV === 'production' &&
    (process.env.NEXT_PHASE === 'phase-production-build' ||
     process.env.VERCEL_ENV === 'preview' ||
     typeof window === 'undefined' && !process.env.SUPABASE_URL)
  );
};

// Environment configuration check
const isSupabaseConfigured = (): boolean => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
};

// Mock client for build-time and missing environment scenarios
const createMockClient = (): SupabaseClient => {
  console.log('Using Supabase mock client due to missing environment variables.');
  
  const mockResponse = {
    data: null,
    error: null,
    count: 0,
    status: 200,
    statusText: 'OK'
  };

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    upsert: () => mockQuery,
    from: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    contains: () => mockQuery,
    containedBy: () => mockQuery,
    rangeGt: () => mockQuery,
    rangeGte: () => mockQuery,
    rangeLt: () => mockQuery,
    rangeLte: () => mockQuery,
    rangeAdjacent: () => mockQuery,
    overlaps: () => mockQuery,
    textSearch: () => mockQuery,
    match: () => mockQuery,
    not: () => mockQuery,
    or: () => mockQuery,
    filter: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    range: () => mockQuery,
    abortSignal: () => mockQuery,
    single: () => Promise.resolve(mockResponse),
    maybeSingle: () => Promise.resolve(mockResponse),
    csv: () => Promise.resolve(mockResponse),
    geojson: () => Promise.resolve(mockResponse),
    explain: () => Promise.resolve(mockResponse),
    rollback: () => Promise.resolve(mockResponse),
    returns: () => mockQuery,
    then: (resolve: any) => Promise.resolve(mockResponse).then(resolve),
    catch: (reject: any) => Promise.resolve(mockResponse).catch(reject),
  };

  return {
    from: () => mockQuery,
    rpc: () => Promise.resolve(mockResponse),
    schema: () => ({ from: () => mockQuery, rpc: () => Promise.resolve(mockResponse) }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
      setSession: () => Promise.resolve({ data: { session: null }, error: null }),
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: [], error: null }),
        createSignedUrl: () => Promise.resolve({ data: null, error: null }),
        createSignedUrls: () => Promise.resolve({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    realtime: {
      channel: () => ({
        on: () => ({}),
        subscribe: () => Promise.resolve('SUBSCRIBED'),
        unsubscribe: () => Promise.resolve('UNSUBSCRIBED'),
      }),
      removeChannel: () => Promise.resolve('OK'),
      removeAllChannels: () => Promise.resolve('OK'),
      getChannels: () => [],
    },
  } as any;
};

// Server-side lazy client factory
export const createLazyServerClient = async (): Promise<SupabaseClient> => {
  if (isBuildEnv()) {
    return createMockClient();
  }

  // Use private env vars first, fall back to public ones
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createMockClient();
  }

  try {
    // Direct dynamic import to prevent build-time execution
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to create server Supabase client:', error);
    return createMockClient();
  }
};

// Alias for createLazyServerClient for backward compatibility and semantic clarity
export const getSupabaseServerClient = createLazyServerClient;

// Client-side lazy client factory
export const createLazyClientClient = async (): Promise<SupabaseClient> => {
  if (isBuildEnv()) {
    return createMockClient();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createMockClient();
  }

  try {
    // Direct dynamic import to prevent build-time execution
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (error) {
    console.error('Failed to create client Supabase client:', error);
    return createMockClient();
  }
};

// Universal lazy client factory (auto-detects environment)
export const createLazyClient = async (): Promise<SupabaseClient> => {
  if (typeof window === 'undefined') {
    // Server-side
    return createLazyServerClient();
  } else {
    // Client-side
    return createLazyClientClient();
  }
};

// Service role lazy client factory
export const createLazyServiceRoleClient = async (): Promise<SupabaseClient> => {
  if (isBuildEnv()) {
    return createMockClient();
  }

  // Use private env vars first, fall back to public ones for URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Missing Supabase service role environment variables. Using mock client.');
    return createMockClient();
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    console.error('Failed to create service role Supabase client:', error);
    return createMockClient();
  }
};

// Alias for createLazyServiceRoleClient for semantic clarity
export const getSupabaseServiceRoleClient = createLazyServiceRoleClient;
