import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Create a custom hook to use Supabase client
export function useSupabase() {
  const [supabase] = useState(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  });

  return supabase;
}

// Re-export the client for direct imports
export { supabase } from './client';
