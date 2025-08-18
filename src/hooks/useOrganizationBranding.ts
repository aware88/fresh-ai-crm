'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from './useOrganization';

interface OrganizationBranding {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
}

export function useOrganizationBranding() {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    const loadBranding = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Try to fetch organization branding from API
        const response = await fetch(`/api/organizations/${organization.id}/branding`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.branding) {
            // If there's no logo_url in the database but this is WITHCAR, use the default
            const isWithcar = organization.slug?.toLowerCase() === 'withcar' || 
                             organization.name?.toLowerCase() === 'withcar';
            
            const brandingData = {
              ...data.branding,
              logo_url: data.branding.logo_url || (isWithcar ? '/images/organizations/withcar-logo.png' : null)
            };
            
            setBranding(brandingData);
          } else {
            // Fallback to default branding with WITHCAR logo if applicable
            const isWithcar = organization.slug?.toLowerCase() === 'withcar' || 
                             organization.name?.toLowerCase() === 'withcar';
            
            setBranding({
              logo_url: isWithcar ? '/images/organizations/withcar-logo.png' : null,
              primary_color: isWithcar ? '#111111' : '#0f172a',
              secondary_color: isWithcar ? '#1f2937' : '#64748b',
              accent_color: isWithcar ? '#ff6a00' : '#2563eb',
              font_family: 'Inter, system-ui, sans-serif'
            });
          }
        } else {
          // API failed, use defaults
          const isWithcar = organization.slug?.toLowerCase() === 'withcar' || 
                           organization.name?.toLowerCase() === 'withcar';
          
          setBranding({
            logo_url: isWithcar ? '/images/organizations/withcar-logo.png' : null,
            primary_color: isWithcar ? '#111111' : '#0f172a',
            secondary_color: isWithcar ? '#1f2937' : '#64748b',
            accent_color: isWithcar ? '#ff6a00' : '#2563eb',
            font_family: 'Inter, system-ui, sans-serif'
          });
        }
      } catch (error) {
        console.error('Error loading organization branding:', error);
        
        // Error fallback - use defaults
        const isWithcar = organization.slug?.toLowerCase() === 'withcar' || 
                         organization.name?.toLowerCase() === 'withcar';
        
        setBranding({
          logo_url: isWithcar ? '/images/organizations/withcar-logo.png' : null,
          primary_color: isWithcar ? '#111111' : '#0f172a',
          secondary_color: isWithcar ? '#1f2937' : '#64748b',
          accent_color: isWithcar ? '#ff6a00' : '#2563eb',
          font_family: 'Inter, system-ui, sans-serif'
        });
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
    
    // Listen for branding updates (e.g., from logo uploads)
    const handleBrandingUpdate = () => {
      loadBranding();
    };
    
    window.addEventListener('organizationBrandingUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('organizationBrandingUpdated', handleBrandingUpdate);
    };
  }, [organization]);

  return { branding, loading };
}
