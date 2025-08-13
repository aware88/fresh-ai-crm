'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { BrandingTheme } from '@/types/branding';
import { useOrganization } from '@/hooks/useOrganization';

interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { organization, loading: orgLoading } = useOrganization();
  const [brandingTheme, setBrandingTheme] = useState<BrandingTheme | null>(() => {
    // Initialize with cached theme immediately on first render, but validate organization
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('organization-branding');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Only use cache if we can validate it's for the right organization
          // For now, apply a basic validation - if it has organizationId, it should be safe
          if (parsedCache.organizationId) {
            console.log('🎨 ThemeProvider: Initializing with cached theme on first render for org:', parsedCache.organizationId);
            return parsedCache;
          } else {
            console.log('🗑️ ThemeProvider: Clearing invalid cache (no organizationId)');
            localStorage.removeItem('organization-branding');
          }
        }
      } catch (error) {
        console.warn('Failed to load cached theme on initialization:', error);
        localStorage.removeItem('organization-branding');
      }
    }
    return null;
  });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [initialThemeSet, setInitialThemeSet] = useState(false);

  // Provide a sensible default brand for Withcar when branding API is not configured
  const withcarDefaultBrand: BrandingTheme = useMemo(
    () => ({
      // Withcar: dark neutral header text + orange accent
      primaryColor: '#111111',
      secondaryColor: '#1f2937',
      accentColor: '#ff6a00',
      fontFamily: "Inter, system-ui, sans-serif",
      faviconUrl: undefined,
    }),
    []
  );

  // Detect organization type early to prevent theme flashing
  const getInitialTheme = useMemo(() => {
    if (orgLoading || !organization) return null;
    
    const orgSlug = organization?.slug?.toLowerCase();
    const orgName = organization?.name?.toLowerCase();
    
    // Known Withcar organization ID
    const WITHCAR_ORG_ID = '577485fb-50b4-4bb2-a4c6-54b97e1545ad'; // Only the real Withcar ID
    
    // Debug logging
    console.log('🔍 ThemeProvider: Organization check:', {
      id: organization.id,
      name: orgName,
      slug: orgSlug,
      isWithcarById: organization.id === WITHCAR_ORG_ID,
      isWithcarByName: orgName === 'withcar',
      isWithcarBySlug: orgSlug === 'withcar'
    });
    
    // For known organizations, return their theme immediately
    const isWithcar = organization.id === WITHCAR_ORG_ID ||
                      orgSlug === 'withcar' || 
                      orgName === 'withcar';
    
    if (isWithcar) {
      console.log('🎨 ThemeProvider: Detected Withcar organization - applying orange theme');
      return withcarDefaultBrand;
    }
    
    console.log('🎨 ThemeProvider: Non-Withcar organization - using default theme');
    // For other organizations, return null (use default)
    return null;
  }, [organization, orgLoading, withcarDefaultBrand]);

  // Load cached theme and manage organization changes
  useEffect(() => {
    if (!orgLoading && organization) {
      // Always clear cache when organization changes to prevent theme flashing
      console.log('🔄 ThemeProvider: Organization loaded:', organization.name, organization.id);
      
      // Clear any existing cache immediately
      localStorage.removeItem('organization-branding');
      console.log('🗑️ ThemeProvider: Cleared cache for fresh theme loading');
      
      // Reset state for new organization
      setInitialThemeSet(false);
      setBrandingTheme(null); // Clear current theme to force reload
    }
  }, [organization?.id, orgLoading]);

  // Set initial theme immediately when organization is detected
  useEffect(() => {
    if (!orgLoading && organization && !initialThemeSet) {
      const initialTheme = getInitialTheme;
      if (initialTheme) {
        console.log('🎨 ThemeProvider: Setting initial theme for', organization.name);
        setBrandingTheme(initialTheme);
        
        // Cache the initial theme with organization ID
        try {
          localStorage.setItem('organization-branding', JSON.stringify({
            ...initialTheme,
            organizationId: organization.id
          }));
        } catch (error) {
          console.warn('Failed to cache initial branding theme:', error);
        }
      }
      setInitialThemeSet(true);
    }
  }, [organization, orgLoading, getInitialTheme, initialThemeSet]);

  // Fetch detailed organization branding (may override initial theme)
  useEffect(() => {
    const fetchBranding = async () => {
      // Skip if organization is still loading or initial theme not set
      if (orgLoading || !initialThemeSet) {
        return;
      }

      // If no organization, use default branding
      if (!organization) {
        console.log('🎨 ThemeProvider: No organization, using default branding');
        setBrandingTheme(null);
        return;
      }

      try {
        setBrandingLoading(true);
        console.log('🎨 ThemeProvider: Fetching branding for organization:', organization.name);
        
        const response = await fetch(`/api/organizations/${organization.id}/branding`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('🎨 ThemeProvider: No custom branding found, using defaults');
            // If this is Withcar, apply our default Withcar brand
            const orgSlug = organization?.slug?.toLowerCase();
            const orgName = organization?.name?.toLowerCase();
            const WITHCAR_ORG_ID = '577485fb-50b4-4bb2-a4c6-54b97e1545ad'; // Only the real Withcar ID
            const isWithcar = organization.id === WITHCAR_ORG_ID ||
                              orgSlug === 'withcar' || 
                              orgName === 'withcar';
            
            if (isWithcar) {
              setBrandingTheme(withcarDefaultBrand);
            } else {
              setBrandingTheme(null);
            }
            return;
          }
          throw new Error(`Failed to fetch branding: ${response.status}`);
        }
        
        const json = await response.json();
        // API may return either the branding object directly or under the `branding` key, and keys may be snake_case
        const payload = json?.branding ?? json;
        const normalized: BrandingTheme = {
          primaryColor: payload.primaryColor ?? payload.primary_color ?? withcarDefaultBrand.primaryColor,
          secondaryColor: payload.secondaryColor ?? payload.secondary_color ?? withcarDefaultBrand.secondaryColor,
          accentColor: payload.accentColor ?? payload.accent_color ?? withcarDefaultBrand.accentColor,
          fontFamily: payload.fontFamily ?? payload.font_family ?? withcarDefaultBrand.fontFamily,
          faviconUrl: payload.faviconUrl ?? payload.favicon_url,
        };
        console.log('🎨 ThemeProvider: Applied organization branding');
        setBrandingTheme(normalized);
        
        // Cache the theme to prevent flashing on future loads
        try {
          localStorage.setItem('organization-branding', JSON.stringify({
            ...normalized,
            organizationId: organization.id
          }));
        } catch (error) {
          console.warn('Failed to cache branding theme:', error);
        }
        
      } catch (error) {
        console.error('🎨 ThemeProvider: Error fetching branding:', error);
        // On error, fall back to Withcar default if applicable
        const orgSlug = organization?.slug?.toLowerCase();
        const orgName = organization?.name?.toLowerCase();
        const WITHCAR_ORG_ID = '577485fb-50b4-4bb2-a4c6-54b97e1545ad'; // Only the real Withcar ID
        const isWithcar = organization.id === WITHCAR_ORG_ID ||
                          orgSlug === 'withcar' || 
                          orgName === 'withcar';
        
        if (isWithcar) {
          setBrandingTheme(withcarDefaultBrand);
        } else {
          setBrandingTheme(null);
        }
      } finally {
        setBrandingLoading(false);
      }
    };

    fetchBranding();
  }, [organization, orgLoading, withcarDefaultBrand, initialThemeSet]);
  
  // Apply custom CSS variables
  useEffect(() => {
    if (!brandingTheme) return;

    document.documentElement.style.setProperty('--primary-color', brandingTheme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', brandingTheme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', brandingTheme.accentColor);
    document.documentElement.style.setProperty('--font-family', brandingTheme.fontFamily);

    // Provide gradient stops derived from accent color if not explicitly set
    // Start/mid/end use same accent by default; can be customized by admin UI later
    document.documentElement.style.setProperty('--brand-start', brandingTheme.accentColor);
    document.documentElement.style.setProperty('--brand-mid', brandingTheme.accentColor);
    document.documentElement.style.setProperty('--brand-end', brandingTheme.accentColor);

    // Update favicon only when branding explicitly provides one
    if (brandingTheme.faviconUrl) {
      const links = [
        ...Array.from(document.querySelectorAll('link[rel="icon"]')),
        ...Array.from(document.querySelectorAll('link[rel=\"shortcut icon\"]')),
      ];
      if (links.length > 0) {
        links.forEach((link) => link.setAttribute('href', brandingTheme.faviconUrl!));
      } else {
        const ico = document.createElement('link');
        ico.rel = 'icon';
        ico.href = brandingTheme.faviconUrl;
        document.head.appendChild(ico);
      }
    }
  }, [brandingTheme]);
  
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
