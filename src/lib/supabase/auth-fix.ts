import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with optimized auth settings to prevent refresh token errors
 * This provides a balance between functionality and stability
 */
export const createNoAuthClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables');
    return null;
  }
  
  try {
    // Create client with optimized auth settings
    // - persistSession: true to maintain session across page loads
    // - autoRefreshToken: true to automatically refresh tokens
    // - storageKey: custom key to avoid conflicts
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'fresh-ai-crm-auth-storage',
        flowType: 'pkce'
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};
