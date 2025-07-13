import { createClient as supabaseCreateClient, User } from '@supabase/supabase-js';

// Re-export createClient for backward compatibility
export const createClient = supabaseCreateClient;

// Check if environment variables are available
const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for development if environment variables are missing
const createMockClient = () => {
  console.warn('Missing Supabase environment variables. Using mock client.');
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  } as any;
};

// Create the Supabase client or a mock client if in development
export const supabase = hasSupabaseConfig
  ? supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : process.env.NODE_ENV === 'development'
  ? createMockClient()
  : (() => { throw new Error('Missing Supabase environment variables'); })();

export const getSupabaseWithAuth = (accessToken: string) => {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

/**
 * Get the current authenticated user ID
 * @returns The user ID if authenticated, null otherwise
 */
export const getUserId = async (): Promise<string | null> => {
  if (!supabase) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Get the current authenticated user
 * @returns The user object if authenticated, null otherwise
 */
export const getUser = async (): Promise<User | null> => {
  if (!supabase) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};
