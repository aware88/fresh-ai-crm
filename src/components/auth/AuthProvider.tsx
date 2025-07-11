'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

/**
 * Enhanced AuthProvider that maintains session state across the entire app
 * - Configures NextAuth SessionProvider with optimal settings
 * - Ensures session persistence across page navigations
 * - Implements frequent session checks to prevent session timeouts
 * - Maintains authentication state until explicit logout
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={2 * 60} // Refetch session every 2 minutes (more frequent)
      refetchOnWindowFocus={true} // Always refresh when window gets focus
      refetchWhenOffline={false} // Don't waste resources when offline
    >
      <SessionRefresher />
      {children}
    </SessionProvider>
  );
}

/**
 * Component that periodically refreshes the session to keep it alive
 * This helps prevent session timeouts when the user is inactive
 */
function SessionRefresher() {
  useEffect(() => {
    // Create a heartbeat to keep the session alive
    const interval = setInterval(() => {
      // Ping the session endpoint to refresh the session
      fetch('/api/auth/session', { method: 'GET', credentials: 'include' })
        .catch(error => console.error('Session refresh error:', error));
    }, 10 * 60 * 1000); // Every 10 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return null;
}
