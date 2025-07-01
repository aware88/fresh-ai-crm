import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

// Get the current user ID from the session
export async function getUID(): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// Check if the current user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const uid = await getUID();
  return !!uid;
}

// Get the current user's session
export async function getSession() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get the current user
export async function getUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
