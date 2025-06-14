import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createNoAuthClient } from './auth-fix';

// We're deliberately avoiding authentication to prevent the freezing issues
// that were present in the original Next.js 15.3.3 + Supabase auth project

// Singleton instance to avoid multiple client creations
let supabaseInstance: SupabaseClient | null = null;

// Create a single supabase client for interacting with your database
export const createSupabaseClient = () => {
  // Return existing instance if already created
  if (supabaseInstance) return supabaseInstance;
  
  // These environment variables will need to be set in .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check your .env.local file.');
    return null;
  }
  
  try {
    // Use the auth-fix implementation to prevent refresh token errors
    supabaseInstance = createNoAuthClient();
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};

// Export a client-safe version that only creates the client on the client-side
export const clientSupabase = () => {
  if (typeof window === 'undefined') {
    return null; // Return null on the server side
  }
  
  try {
    return createSupabaseClient();
  } catch (error) {
    console.error('Failed to initialize client-side Supabase instance:', error);
    return null;
  }
};

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  // For now, always return false to force using mock data
  // until we properly set up Supabase authentication
  return false;
  
  // Uncomment this when Supabase is properly configured
  // return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};
