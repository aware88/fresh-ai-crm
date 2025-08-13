import { createServerClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get the current user ID from the session
export async function getUID(): Promise<string | null> {
  try {
    // Prefer NextAuth session (source of truth in this app)
    const session = await getServerSession(authOptions as any);
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.userId;
    if (sessionUserId) return sessionUserId;

    // Fallback to Supabase auth if available
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
}

// Check if the current user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const uid = await getUID();
  return !!uid;
}

// Get the current user's session
export async function getSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get the current user
export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
