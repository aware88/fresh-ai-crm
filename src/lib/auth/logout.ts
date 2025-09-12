import { signOut } from 'next-auth/react';

/**
 * Complete logout utility that clears all auth-related data
 * This ensures no stale authentication data persists
 */
export async function signOutComplete(options?: {
  redirect?: boolean;
  callbackUrl?: string;
}) {
  try {
    console.log('🚪 Starting complete logout process...');
    
    // Step 1: Clear NextAuth session
    await signOut({ 
      redirect: false,
      callbackUrl: options?.callbackUrl || '/signin'
    });
    
    // Step 2: Clear all localStorage items
    if (typeof window !== 'undefined') {
      // Clear known auth-related items
      const keysToRemove = [
        'organization-context',
        'user-preferences', 
        'subscription-data',
        'email-sync-status',
        'ai-cache',
        'next-auth.callback-url'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      console.log('🧹 Cleared browser storage');
    }
    
    // Step 3: Clear specific cookies (for development)
    if (typeof document !== 'undefined') {
      const cookiesToClear = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.session-token', // Secure version
      ];
      
      cookiesToClear.forEach(cookie => {
        // Clear for current domain
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        // Clear for parent domain (if applicable)
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain}`;
      });
      
      console.log('🍪 Cleared authentication cookies');
    }
    
    // Step 4: Redirect or reload
    if (options?.redirect !== false) {
      if (typeof window !== 'undefined') {
        // Force a complete page reload to clear all app state
        window.location.href = options?.callbackUrl || '/signin';
      }
    }
    
    console.log('✅ Complete logout finished');
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Fallback: force redirect even if logout failed
    if (typeof window !== 'undefined' && options?.redirect !== false) {
      window.location.href = '/signin';
    }
  }
}

/**
 * Development-only session clearing utility
 * Clears all auth data without API calls
 */
export function clearDevSessions() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('clearDevSessions should only be used in development');
    return;
  }
  
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Clearing development sessions...');
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all cookies
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
  
  console.log('✅ Development session cleared - refresh the page');
}

/**
 * Check if user needs to re-authenticate
 * Useful for detecting expired sessions
 */
export function isSessionExpired(session: any): boolean {
  if (!session || !session.expires) return true;
  
  const expiryTime = new Date(session.expires).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes buffer
  
  return (expiryTime - now) < fiveMinutes;
}