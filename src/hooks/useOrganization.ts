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

export function useOrganization(): UseOrganizationResult {
  const { data: session, status } = useSession();
  const [organization, setOrganizationState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading=true
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    // If session is still loading, keep loading state
    if (status === 'loading') {
      console.log('🏢 useOrganization: Session still loading, waiting...');
      return;
    }
    
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('🏢 useOrganization: Not authenticated, skipping fetch');
      setOrganizationState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
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
      
      // If no organization ID, user is independent
      if (!prefs.current_organization_id) {
        console.log('🏢 useOrganization: User is independent (no organization)');
        setOrganizationState(null);
        return;
      }
      
      console.log('🏢 useOrganization: Fetching organization:', prefs.current_organization_id);
      
      // Fetch the organization
      const orgResponse = await fetch(`/api/organizations/${prefs.current_organization_id}`);
      
      if (!orgResponse.ok) {
        if (orgResponse.status === 404) {
          console.log('🏢 useOrganization: Organization not found, treating as independent user');
          setOrganizationState(null);
          return;
        }
        throw new Error(`Failed to fetch organization: ${orgResponse.status}`);
      }
      
      const orgData = await orgResponse.json();
      console.log('🏢 useOrganization: Successfully loaded organization:', orgData.name);
      setOrganizationState(orgData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization';
      console.error('🏢 useOrganization: Error:', errorMessage);
      setError(errorMessage);
      // On error, treat as independent user rather than breaking
      setOrganizationState(null);
    } finally {
      setLoading(false);
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
