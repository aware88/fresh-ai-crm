import { Session } from 'next-auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Validates that a NextAuth session is still valid
 * Checks if the user still exists in the database
 */
export async function validateSession(session: Session | null): Promise<Session | null> {
  if (!session?.user?.id) {
    return null;
  }
  
  try {
    const supabase = createServiceRoleClient();
    
    // Check if user still exists in auth.users
    const { data: user, error } = await supabase.auth.admin.getUserById(session.user.id);
    
    if (error || !user) {
      console.warn('Session validation failed: User not found', { userId: session.user.id, error });
      return null;
    }
    
    // Check if user is still confirmed (not deleted/disabled)
    if (!user.user?.email_confirmed_at) {
      console.warn('Session validation failed: User email not confirmed', { userId: session.user.id });
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    // In case of database errors, allow the session to continue
    // but log the issue for monitoring
    return session;
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth<T extends any[]>(
  handler: (req: any, ...args: T) => Promise<Response>, 
  requireSession = true
) {
  return async (req: any, ...args: T): Promise<Response> => {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    
    const session = await getServerSession(authOptions);
    
    if (requireSession) {
      const validSession = await validateSession(session);
      
      if (!validSession) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Please sign in again' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    return handler(req, ...args);
  };
}

/**
 * Hook for client-side session validation
 */
export async function validateClientSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    
    if (!session?.user?.id) {
      return false;
    }
    
    // Additional client-side validation can be added here
    return true;
  } catch (error) {
    console.error('Client session validation error:', error);
    return false;
  }
}