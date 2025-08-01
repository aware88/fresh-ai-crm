'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState, useEffect } from 'react';

/**
 * Authentication hook that provides a consistent interface to NextAuth session
 * 
 * This is a wrapper around NextAuth's useSession that:
 * - Provides consistent status and session handling  
 * - Includes helper properties for common authentication checks
 * - Maintains compatibility with existing code
 * - Handles race conditions more gracefully
 * 
 * Usage:
 * const { data: session, status, isAuthenticated, isLoading } = useOptimizedAuth();
 */
export function useOptimizedAuth() {
  const { data: session, status, update } = useSession();
  const [initialLoad, setInitialLoad] = useState(true);
  const [sessionStable, setSessionStable] = useState(false);
  
  // Track initial load to prevent race conditions
  useEffect(() => {
    if (status !== 'loading') {
      // Longer delay to ensure NextAuth has fully processed and cookies are read
      const timer = setTimeout(() => {
        setInitialLoad(false);
        setSessionStable(true);
      }, 200); // Increased from 100ms to 200ms
      return () => clearTimeout(timer);
    }
  }, [status]);
  
  // Additional stability check when session changes
  useEffect(() => {
    if (session && status === 'authenticated') {
      const timer = setTimeout(() => {
        setSessionStable(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [session, status]);
  
  // Memoize user ID for effect dependencies
  const userId = useMemo(() => session?.user?.id || null, [session?.user?.id]);
  
  // More robust status determination - be very conservative about showing unauthenticated state
  const isLoading = status === 'loading' || initialLoad || !sessionStable;
  const isAuthenticated = status === 'authenticated' && !!session && !!session.user;
  
  // Only consider truly unauthenticated if we're completely done loading AND definitely no session
  const effectiveStatus = isLoading ? 'loading' : 
                         (isAuthenticated ? 'authenticated' : 'unauthenticated');
  
  return {
    data: session,
    status: effectiveStatus,
    update, // Include the update function for session mutations
    userId, // Convenient access to stable user ID for effects
    isAuthenticated,
    isLoading
  };
}

/**
 * Hook for components that only need to know if user is authenticated
 * This is more efficient than full session data for simple auth checks
 */
export function useAuthStatus() {
  const { status } = useSession();
  
  return useMemo(() => ({
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
    isLoading: status === 'loading'
  }), [status]);
} 