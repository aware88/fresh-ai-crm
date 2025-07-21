'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface OptimizedSessionContextType {
  session: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  lastUpdated: number;
}

const OptimizedSessionContext = createContext<OptimizedSessionContextType>({
  session: null,
  status: 'loading',
  lastUpdated: 0
});

interface OptimizedSessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function OptimizedSessionProvider({ children, session: initialSession }: OptimizedSessionProviderProps) {
  const [cachedSession, setCachedSession] = useState<Session | null>(initialSession || null);
  const [status, setStatus] = useState<'authenticated' | 'unauthenticated' | 'loading'>(
    initialSession ? 'authenticated' : 'loading'
  );
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const sessionCache = useRef<{ session: Session | null; timestamp: number } | null>(null);
  
  // Cache duration: 5 minutes (300,000 ms)
  const CACHE_DURATION = 5 * 60 * 1000;
  
  useEffect(() => {
    // Initialize with any existing session
    if (initialSession) {
      setCachedSession(initialSession);
      setStatus('authenticated');
      sessionCache.current = { session: initialSession, timestamp: Date.now() };
      setLastUpdated(Date.now());
    }
  }, [initialSession]);

  const contextValue: OptimizedSessionContextType = {
    session: cachedSession,
    status,
    lastUpdated
  };

  return (
    <OptimizedSessionContext.Provider value={contextValue}>
      <SessionProvider 
        session={initialSession}
        refetchInterval={10 * 60} // Only refetch every 10 minutes
        refetchOnWindowFocus={false} // Disable refetch on window focus
        refetchWhenOffline={false} // Disable refetch when offline
      >
        {children}
      </SessionProvider>
    </OptimizedSessionContext.Provider>
  );
}

// Custom hook that provides optimized session access
export function useOptimizedSession() {
  const context = useContext(OptimizedSessionContext);
  
  if (!context) {
    throw new Error('useOptimizedSession must be used within OptimizedSessionProvider');
  }
  
  return {
    data: context.session,
    status: context.status,
    lastUpdated: context.lastUpdated
  };
}

export { OptimizedSessionContext }; 