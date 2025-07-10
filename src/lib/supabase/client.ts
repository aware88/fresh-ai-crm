import { createClient, User } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const getSupabaseWithAuth = (accessToken: string) => {
  return createClient(
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
