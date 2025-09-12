/**
 * Development Mode Session Management
 * 
 * Utilities for managing authentication state during development
 * Helps with testing and debugging authentication flows
 */

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { clearDevSessions } from '@/lib/auth/logout';

/**
 * Development session debug information
 */
export interface DevSessionInfo {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  userId?: string;
  email?: string;
  expires?: string;
  tokenAge?: number;
  isExpiringSoon?: boolean;
}

/**
 * Hook for development session monitoring
 */
export function useDevSessionInfo(): DevSessionInfo | null {
  const { data: session, status } = useSession();
  const [sessionInfo, setSessionInfo] = useState<DevSessionInfo | null>(null);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    const info: DevSessionInfo = {
      status,
      userId: session?.user?.id?.slice(0, 8),
      email: session?.user?.email,
      expires: session?.expires,
    };
    
    // Calculate token age and expiry status
    if (session?.expires) {
      const expiryTime = new Date(session.expires).getTime();
      const now = Date.now();
      const age = now - (expiryTime - 2 * 60 * 60 * 1000); // 2 hours max age
      
      info.tokenAge = Math.round(age / 1000 / 60); // Age in minutes
      info.isExpiringSoon = (expiryTime - now) < 15 * 60 * 1000; // Expires in < 15 min
    }
    
    setSessionInfo(info);
  }, [session, status]);
  
  return sessionInfo;
}

/**
 * Development session debug panel component
 */
export function SessionDebugPanel() {
  const sessionInfo = useDevSessionInfo();
  
  if (process.env.NODE_ENV !== 'development' || !sessionInfo) {
    return null;
  }
  
  const handleClearSession = () => {
    clearDevSessions();
  };
  
  const statusColor = {
    loading: 'bg-yellow-600',
    authenticated: sessionInfo.isExpiringSoon ? 'bg-orange-600' : 'bg-green-600',
    unauthenticated: 'bg-red-600'
  }[sessionInfo.status];
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs font-mono border border-gray-700 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-green-400">Dev Session Info</div>
        <button
          onClick={handleClearSession}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          title="Clear all sessions"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span>Status: {sessionInfo.status}</span>
        </div>
        
        {sessionInfo.userId && (
          <div>User: {sessionInfo.userId}</div>
        )}
        
        {sessionInfo.email && (
          <div>Email: {sessionInfo.email}</div>
        )}
        
        {sessionInfo.expires && (
          <div>
            Expires: {new Date(sessionInfo.expires).toLocaleTimeString()}
          </div>
        )}
        
        {sessionInfo.tokenAge !== undefined && (
          <div className={sessionInfo.isExpiringSoon ? 'text-orange-400' : ''}>
            Age: {sessionInfo.tokenAge}m
            {sessionInfo.isExpiringSoon && ' (expiring soon!)'}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-gray-400 text-xs">
        Session duration: 2 hours
      </div>
    </div>
  );
}

/**
 * Development authentication utilities
 */
export const devAuth = {
  /**
   * Clear all authentication data (dev only)
   */
  clearSessions: () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('clearSessions is only available in development');
      return;
    }
    clearDevSessions();
  },
  
  /**
   * Get current session info for debugging
   */
  getSessionInfo: (): DevSessionInfo | null => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    // This would need to be called from a React component context
    console.warn('getSessionInfo should be called from useDevSessionInfo hook');
    return null;
  },
  
  /**
   * Log session details to console
   */
  logSession: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const cookies = document.cookie.split(';')
      .filter(cookie => cookie.includes('next-auth'))
      .map(cookie => cookie.trim());
      
    console.group('🔍 Development Session Debug');
    console.log('Auth Cookies:', cookies);
    console.log('LocalStorage auth keys:', 
      Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('session') || key.includes('organization')
      )
    );
    console.groupEnd();
  }
};

/**
 * Auto-clear sessions on app startup in development
 * This can be called from _app.tsx or layout component
 */
export function initDevSessionManager() {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Check if we should auto-clear sessions (useful for testing)
  const shouldAutoClear = localStorage.getItem('dev-auto-clear-sessions') === 'true';
  
  if (shouldAutoClear) {
    console.log('🧹 Auto-clearing development sessions...');
    clearDevSessions();
    localStorage.removeItem('dev-auto-clear-sessions');
  }
}

/**
 * Enable auto-clear on next page load (for testing)
 */
export function enableAutoClearOnNextLoad() {
  if (process.env.NODE_ENV !== 'development') return;
  localStorage.setItem('dev-auto-clear-sessions', 'true');
  console.log('✅ Auto-clear enabled for next page load');
}