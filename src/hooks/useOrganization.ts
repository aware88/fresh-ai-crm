'use client';

import { useState, useEffect, useCallback } from 'react';
import { Organization } from '@/types/organizations';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';

interface UseOrganizationResult {
  organization: Organization | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to get the current user's organization
 * 
 * This hook fetches the current user's organization from Supabase
 * and provides loading and error states.
 */
/**
 * Creates a default organization object when database queries fail
 * This helps the app continue working even when organization data can't be retrieved
 */
function createDefaultOrganization(userId: string): Organization {
  return {
    id: 'default-org',
    name: 'Default Organization',
    slug: null,
    description: null,
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    domain: null,
    is_active: true,
    subscription_tier: 'free',
    subscription_status: 'active',
    subscription_start_date: null,
    subscription_end_date: null,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Global cache to prevent multiple simultaneous API calls
let organizationCache: {
  data: Organization | null;
  loading: boolean;
  error: string | null;
  lastFetch: number;
  subscribers: Set<(data: any) => void>;
} = {
  data: null,
  loading: false,
  error: null,
  lastFetch: 0,
  subscribers: new Set()
};

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute (reduced for debugging)

export function useOrganization(): UseOrganizationResult {
  const { data: session, status } = useSession();
  const [organization, setOrganizationState] = useState<Organization | null>(organizationCache.data);
  const [loading, setLoading] = useState(organizationCache.loading || true);
  const [error, setError] = useState<string | null>(organizationCache.error);

  // Subscribe to cache updates
  useEffect(() => {
    const updateState = (cacheData: typeof organizationCache) => {
      setOrganizationState(cacheData.data);
      setLoading(cacheData.loading);
      setError(cacheData.error);
    };

    organizationCache.subscribers.add(updateState);
    return () => {
      organizationCache.subscribers.delete(updateState);
    };
  }, []);

  const fetchOrganization = useCallback(async () => {
    console.log('🏢 useOrganization: fetchOrganization called', { 
      status, 
      hasSession: !!session, 
      userId: session?.user?.id,
      cacheLoading: organizationCache.loading,
      cacheData: !!organizationCache.data 
    });
    
    // If session is still loading, keep loading state
    if (status === 'loading') {
      console.log('🏢 useOrganization: Session still loading, waiting...');
      return;
    }
    
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('🏢 useOrganization: Not authenticated, skipping fetch');
      const newCache = { ...organizationCache, data: null, loading: false, error: null };
      organizationCache = newCache;
      organizationCache.subscribers.forEach(callback => callback(newCache));
      return;
    }

    // Check if we have fresh cached data
    const now = Date.now();
    if (organizationCache.data && (now - organizationCache.lastFetch) < CACHE_DURATION) {
      console.log('🏢 useOrganization: Using cached data');
      return;
    }

    // Prevent multiple simultaneous fetches
    if (organizationCache.loading) {
      console.log('🏢 useOrganization: Already fetching, waiting for result...');
      return;
    }

    try {
      // Update cache loading state
      const loadingCache = { ...organizationCache, loading: true, error: null };
      organizationCache = loadingCache;
      organizationCache.subscribers.forEach(callback => callback(loadingCache));
      
      console.log('🏢 useOrganization: Fetching user preferences for user:', session.user.id);
      
      // First get user preferences to see if they have an organization
      const prefsResponse = await fetch('/api/user/preferences');
      
      if (!prefsResponse.ok) {
        if (prefsResponse.status === 404) {
          console.log('🏢 useOrganization: No user preferences found, user is independent');
          setOrganizationState(null);
          return;
        }
        throw new Error(`Failed to fetch user preferences: ${prefsResponse.status}`);
      }
      
      const prefs = await prefsResponse.json();
      console.log('🏢 useOrganization: User preferences:', prefs);
      
      // Cache user preferences in localStorage for immediate theme detection
      try {
        localStorage.setItem('user-preferences', JSON.stringify(prefs));
      } catch (error) {
        console.warn('Failed to cache user preferences:', error);
      }
      
      // If no organization ID, user is independent
      if (!prefs.current_organization_id) {
        console.log('🏢 useOrganization: User is independent (no organization)');
        const noOrgCache = { 
          ...organizationCache, 
          data: null, 
          loading: false, 
          error: null, 
          lastFetch: Date.now() 
        };
        organizationCache = noOrgCache;
        organizationCache.subscribers.forEach(callback => callback(noOrgCache));
        return;
      }
      
      console.log('🏢 useOrganization: Fetching organization:', prefs.current_organization_id);
      
      // Fetch the organization
      const orgResponse = await fetch(`/api/organizations/${prefs.current_organization_id}`);
      
      if (!orgResponse.ok) {
        if (orgResponse.status === 404) {
          console.log('🏢 useOrganization: Organization not found, treating as independent user');
          const notFoundCache = { 
            ...organizationCache, 
            data: null, 
            loading: false, 
            error: null, 
            lastFetch: Date.now() 
          };
          organizationCache = notFoundCache;
          organizationCache.subscribers.forEach(callback => callback(notFoundCache));
          return;
        }
        throw new Error(`Failed to fetch organization: ${orgResponse.status}`);
      }
      
      const orgData = await orgResponse.json();
      console.log('🏢 useOrganization: Successfully loaded organization:', orgData.name);
      
      // Update cache with success
      const successCache = { 
        ...organizationCache, 
        data: orgData, 
        loading: false, 
        error: null, 
        lastFetch: Date.now() 
      };
      organizationCache = successCache;
      organizationCache.subscribers.forEach(callback => callback(successCache));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization';
      console.error('🏢 useOrganization: Error:', errorMessage);
      
      // Update cache with error
      const errorCache = { 
        ...organizationCache, 
        data: null,
        loading: false, 
        error: errorMessage,
        lastFetch: Date.now()
      };
      organizationCache = errorCache;
      organizationCache.subscribers.forEach(callback => callback(errorCache));
    }
  }, [session?.user?.id, status]);

  // Fetch organization when session changes
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const setOrganization = useCallback((org: Organization | null) => {
    setOrganizationState(org);
  }, []);

  const refreshOrganization = useCallback(async () => {
    console.log('🏢 useOrganization: Force refreshing organization...');
    // Force refresh by clearing cache
    organizationCache = {
      ...organizationCache,
      data: null,
      loading: false,
      lastFetch: 0
    };
    await fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    loading,
    error,
    setOrganization,
    refreshOrganization,
  };
}
