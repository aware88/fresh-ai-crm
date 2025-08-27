import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganization } from './useOrganization';

// Global cache to prevent multiple API calls for the same user/org combination
let adminCache: {
  [key: string]: {
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    lastFetch: number;
    subscribers: Set<(data: any) => void>;
  };
} = {};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to check if current user is an admin of their current organization
 */
export function useOrganizationAdmin() {
  const { data: session } = useSession();
  const { organization, loading: orgLoading } = useOrganization();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${session?.user?.id}-${organization?.id}`;

  // Subscribe to cache updates
  useEffect(() => {
    if (!cacheKey || cacheKey.includes('undefined')) {
      setIsAdmin(false);
      setLoading(orgLoading); // Keep loading if organization is still loading
      return;
    }

    // Initialize cache for this key if it doesn't exist
    if (!adminCache[cacheKey]) {
      adminCache[cacheKey] = {
        isAdmin: false,
        loading: true,
        error: null,
        lastFetch: 0,
        subscribers: new Set()
      };
    }

    const updateState = (cacheData: typeof adminCache[string]) => {
      setIsAdmin(cacheData.isAdmin);
      setLoading(cacheData.loading);
      setError(cacheData.error);
    };

    adminCache[cacheKey].subscribers.add(updateState);
    
    // Set initial state from cache
    updateState(adminCache[cacheKey]);

    return () => {
      adminCache[cacheKey]?.subscribers.delete(updateState);
    };
  }, [cacheKey, orgLoading]);

  const checkAdminStatus = useCallback(async () => {
    if (!session?.user?.id || !organization?.id || orgLoading) {
      const noAccessCache = {
        isAdmin: false,
        loading: orgLoading,
        error: null,
        lastFetch: Date.now(),
        subscribers: adminCache[cacheKey]?.subscribers || new Set()
      };
      adminCache[cacheKey] = noAccessCache;
      adminCache[cacheKey].subscribers.forEach(callback => callback(noAccessCache));
      return;
    }

    const cache = adminCache[cacheKey];
    const now = Date.now();

    // Use cached data if fresh
    if (cache && cache.lastFetch && (now - cache.lastFetch) < CACHE_DURATION) {
      console.log('🔐 useOrganizationAdmin: Using cached admin status');
      return;
    }

    // Prevent multiple simultaneous requests
    if (cache?.loading) {
      console.log('🔐 useOrganizationAdmin: Admin check already in progress');
      return;
    }

    try {
      // Update cache loading state
      const loadingCache = {
        ...cache,
        loading: true,
        error: null
      };
      adminCache[cacheKey] = loadingCache;
      adminCache[cacheKey].subscribers.forEach(callback => callback(loadingCache));

      console.log('🔐 useOrganizationAdmin: Checking admin status for org:', organization.id);

      // Check organization membership and role
      const response = await fetch(`/api/organizations/${organization.id}/members/check-admin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check admin status');
      }

      const data = await response.json();
      const isAdminResult = data.isAdmin || false;

      console.log('🔐 useOrganizationAdmin: Admin check result:', isAdminResult);

      // Update cache with result
      const resultCache = {
        isAdmin: isAdminResult,
        loading: false,
        error: null,
        lastFetch: now,
        subscribers: adminCache[cacheKey].subscribers
      };
      adminCache[cacheKey] = resultCache;
      adminCache[cacheKey].subscribers.forEach(callback => callback(resultCache));

    } catch (err) {
      console.error('Error checking admin status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Update cache with error
      const errorCache = {
        isAdmin: false,
        loading: false,
        error: errorMessage,
        lastFetch: now,
        subscribers: adminCache[cacheKey].subscribers
      };
      adminCache[cacheKey] = errorCache;
      adminCache[cacheKey].subscribers.forEach(callback => callback(errorCache));
    }
  }, [session?.user?.id, organization?.id, orgLoading, cacheKey]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return { isAdmin, loading, error };
}

