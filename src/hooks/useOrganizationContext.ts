/**
 * Organization Context Hook
 * 
 * Provides lazy loading of organization data instead of loading it in the JWT callback.
 * This improves authentication performance and reduces database load.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface OrganizationContext {
  id: string | null;
  name?: string;
  slug?: string;
  tier?: string;
  subscriptionStatus?: string;
  isBeta?: boolean;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    organizationName?: string;
  };
  features?: string[];
  limits?: {
    emailAccounts: number;
    aiTokens: number;
    aiTokensUsed: number;
    teamMembers: number;
  };
}

interface UseOrganizationContextReturn {
  organization: OrganizationContext | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to lazily load organization context for authenticated users
 */
export function useOrganizationContext(): UseOrganizationContextReturn {
  const { data: session, status } = useSession();
  const [organization, setOrganization] = useState<OrganizationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOrganizationData = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') {
      setOrganization(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading organization context for user:', session.user.id);
      
      // First, get user preferences to find organization ID
      const prefsResponse = await fetch('/api/user/preferences');
      if (!prefsResponse.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      
      const preferences = await prefsResponse.json();
      const organizationId = preferences.current_organization_id;
      
      if (!organizationId) {
        console.log('👤 User has no organization - independent user');
        setOrganization({ id: null });
        return;
      }
      
      // Get subscription context (includes organization data)
      const subscriptionResponse = await fetch('/api/subscription/context');
      if (!subscriptionResponse.ok) {
        throw new Error('Failed to fetch subscription context');
      }
      
      const subscriptionData = await subscriptionResponse.json();
      
      // Get organization branding
      const brandingResponse = await fetch(`/api/organizations/${organizationId}/branding`);
      let brandingData = null;
      if (brandingResponse.ok) {
        brandingData = await brandingResponse.json();
      }
      
      // Get organization details
      const orgResponse = await fetch(`/api/organizations/${organizationId}`);
      let orgData = null;
      if (orgResponse.ok) {
        orgData = await orgResponse.json();
      }
      
      const organizationContext: OrganizationContext = {
        id: organizationId,
        name: orgData?.name || brandingData?.organization_name,
        slug: orgData?.slug,
        tier: subscriptionData?.tier,
        subscriptionStatus: orgData?.subscription_status,
        isBeta: orgData?.beta_early_adopter || subscriptionData?.isBetaUser,
        branding: brandingData ? {
          logoUrl: brandingData.logo_url,
          primaryColor: brandingData.primary_color,
          secondaryColor: brandingData.secondary_color,
          organizationName: brandingData.organization_name,
        } : undefined,
        features: subscriptionData?.features,
        limits: subscriptionData?.limits,
      };
      
      console.log('✅ Organization context loaded:', {
        id: organizationContext.id,
        name: organizationContext.name,
        tier: organizationContext.tier
      });
      
      setOrganization(organizationContext);
      
      // Cache the result for performance
      if (typeof window !== 'undefined') {
        localStorage.setItem('organization-context', JSON.stringify({
          data: organizationContext,
          timestamp: Date.now(),
          userId: session.user.id
        }));
      }
      
    } catch (err) {
      console.error('❌ Failed to load organization context:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization data');
      
      // Try to use cached data as fallback
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('organization-context');
        if (cached) {
          try {
            const { data, timestamp, userId } = JSON.parse(cached);
            // Use cache if it's less than 5 minutes old and for the same user
            if (Date.now() - timestamp < 5 * 60 * 1000 && userId === session.user.id) {
              setOrganization(data);
              console.log('📦 Using cached organization context as fallback');
            }
          } catch (cacheError) {
            console.warn('Failed to parse cached organization context:', cacheError);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, status]);
  
  const refetch = useCallback(() => {
    // Clear cache and refetch
    if (typeof window !== 'undefined') {
      localStorage.removeItem('organization-context');
    }
    fetchOrganizationData();
  }, [fetchOrganizationData]);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setOrganization(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    // Check for cached data first
    if (typeof window !== 'undefined' && session?.user?.id) {
      const cached = localStorage.getItem('organization-context');
      if (cached) {
        try {
          const { data, timestamp, userId } = JSON.parse(cached);
          // Use cache if it's less than 2 minutes old and for the same user
          if (Date.now() - timestamp < 2 * 60 * 1000 && userId === session.user.id) {
            setOrganization(data);
            console.log('📦 Using cached organization context');
            return;
          }
        } catch (cacheError) {
          console.warn('Failed to parse cached organization context:', cacheError);
        }
      }
    }
    
    fetchOrganizationData();
  }, [session?.user?.id, status, fetchOrganizationData]);
  
  return {
    organization,
    loading,
    error,
    refetch
  };
}

/**
 * Lightweight hook that only returns organization ID from user preferences
 * Useful when you only need to know if user has an organization
 */
export function useOrganizationId(): {
  organizationId: string | null;
  loading: boolean;
} {
  const { data: session, status } = useSession();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user?.id) {
      setOrganizationId(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        setOrganizationId(data.current_organization_id || null);
      })
      .catch(error => {
        console.error('Failed to fetch organization ID:', error);
        setOrganizationId(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session?.user?.id, status]);
  
  return { organizationId, loading };
}