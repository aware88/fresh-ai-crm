'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from './useOrganization';

interface OrganizationBranding {
  logo_url?: string | null;
  organization_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
}

// Global cache for branding to prevent multiple API calls
let brandingCache: {
  [orgId: string]: {
    data: OrganizationBranding | null;
    loading: boolean;
    lastFetch: number;
    subscribers: Set<(data: any) => void>;
  };
} = {};

const BRANDING_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useOrganizationBranding() {
  const { organization, loading: orgLoading } = useOrganization();
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to cache updates for this organization
  useEffect(() => {
    if (!organization?.id) {
      setBranding(null);
      setLoading(false);
      return;
    }

    const orgId = organization.id;
    
    // Initialize cache for this org if it doesn't exist
    if (!brandingCache[orgId]) {
      brandingCache[orgId] = {
        data: null,
        loading: false,
        lastFetch: 0,
        subscribers: new Set()
      };
    }

    const updateState = (cacheData: typeof brandingCache[string]) => {
      setBranding(cacheData.data);
      setLoading(cacheData.loading);
    };

    brandingCache[orgId].subscribers.add(updateState);
    
    // Set initial state from cache
    updateState(brandingCache[orgId]);

    return () => {
      brandingCache[orgId]?.subscribers.delete(updateState);
    };
  }, [organization?.id]);

  useEffect(() => {
    const loadBranding = async () => {
      // Wait for organization to load
      if (orgLoading || !organization?.id) {
        setLoading(orgLoading);
        return;
      }

      const orgId = organization.id;
      const cache = brandingCache[orgId];
      
      // Check if we have fresh cached data
      const now = Date.now();
      if (cache.data && (now - cache.lastFetch) < BRANDING_CACHE_DURATION) {
        console.log('🎨 useOrganizationBranding: Using cached branding data');
        return;
      }

      // Prevent multiple simultaneous fetches
      if (cache.loading) {
        console.log('🎨 useOrganizationBranding: Already fetching branding, waiting...');
        return;
      }

      try {
        // Update cache loading state
        cache.loading = true;
        cache.subscribers.forEach(callback => callback(cache));
        
        // Try to fetch organization branding from API
        const response = await fetch(`/api/organizations/${organization.id}/branding`);
        
        let brandingData: OrganizationBranding;
        
        if (response.ok) {
          const data = await response.json();
          console.log('🎨 useOrganizationBranding: API response:', data);
          console.log('🎨 useOrganizationBranding: Organization ID:', organization.id);
          
          if (data.branding) {
            // Use the branding data as-is from the API
            brandingData = data.branding;
            console.log('🎨 useOrganizationBranding: Using data.branding:', brandingData);
          } else if (data.logo_url || data.primary_color) {
            // API returned branding data directly (not wrapped in 'branding' property)
            brandingData = data;
            console.log('🎨 useOrganizationBranding: Using direct data:', brandingData);
          } else {
            // Fallback to default branding for all organizations
            brandingData = {
              logo_url: null, // No logo by default - organizations upload their own
              organization_name: null, // No organization name by default - will use ARIS
              primary_color: '#0f172a',
              secondary_color: '#64748b',
              accent_color: '#2563eb',
              font_family: 'Inter, system-ui, sans-serif'
            };
            console.log('🎨 useOrganizationBranding: Using default branding (no data)');
          }
        } else {
          // API failed, use generic defaults for all organizations
          brandingData = {
            logo_url: null,
            organization_name: null,
            primary_color: '#0f172a',
            secondary_color: '#64748b',
            accent_color: '#2563eb',
            font_family: 'Inter, system-ui, sans-serif'
          };
        }

        // Update cache with success
        console.log('🎨 useOrganizationBranding: Updating cache with branding data:', brandingData);
        cache.data = brandingData;
        cache.loading = false;
        cache.lastFetch = Date.now();
        cache.subscribers.forEach(callback => callback(cache));
        
      } catch (error) {
        console.error('Error loading organization branding:', error);
        
        // Error fallback - use generic defaults
        const fallbackBranding = {
          logo_url: null,
          organization_name: null,
          primary_color: '#0f172a',
          secondary_color: '#64748b',
          accent_color: '#2563eb',
          font_family: 'Inter, system-ui, sans-serif'
        };

        // Update cache with fallback
        cache.data = fallbackBranding;
        cache.loading = false;
        cache.lastFetch = Date.now();
        cache.subscribers.forEach(callback => callback(cache));
      }
    };

    loadBranding();
    
    // Listen for branding updates (e.g., from logo uploads)
    const handleBrandingUpdate = () => {
      console.log('🎨 useOrganizationBranding: Received branding update event');
      if (organization?.id && brandingCache[organization.id]) {
        // Clear cache to force refresh
        brandingCache[organization.id].lastFetch = 0;
        console.log('🎨 useOrganizationBranding: Cleared cache for org:', organization.id);
      }
      loadBranding();
    };
    
    window.addEventListener('organizationBrandingUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('organizationBrandingUpdated', handleBrandingUpdate);
    };
  }, [organization?.id, orgLoading]);

  return { branding, loading };
}
