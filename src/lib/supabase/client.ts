import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

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
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
    throw new Error('Missing Supabase environment variables');
  }
  
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
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
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};
