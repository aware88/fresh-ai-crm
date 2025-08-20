'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { BrandingTheme } from '@/types/branding';

import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

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
      organizationId: undefined,
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
      console.log('🔄 ThemeProvider: Organization loaded:', organization.name, organization.id);
      
      // Only clear cache if organization actually changed
      const cachedOrgId = brandingTheme?.organizationId;
      if (cachedOrgId && cachedOrgId !== organization.id) {
        console.log('🔄 ThemeProvider: Organization changed, clearing cache');
        localStorage.removeItem('organization-branding');
        setInitialThemeSet(false);
        setBrandingTheme(null);
      } else if (!cachedOrgId) {
        // First time loading this organization
        setInitialThemeSet(false);
      }
    }
  }, [organization?.id, orgLoading, brandingTheme?.organizationId]);

  // Set initial theme immediately when organization is detected
  useEffect(() => {
    if (!orgLoading && organization && !initialThemeSet) {
      // Check if we already have a valid cached theme for this organization
      if (brandingTheme?.organizationId === organization.id) {
        console.log('🎨 ThemeProvider: Using existing cached theme for', organization.name);
        setInitialThemeSet(true);
        return;
      }
      
      const initialTheme = getInitialTheme;
      if (initialTheme) {
        console.log('🎨 ThemeProvider: Setting initial theme for', organization.name);
        const themeWithOrgId = {
          ...initialTheme,
          organizationId: organization.id
        };
        
        // Only set theme if it's different from current to prevent flashing
        if (!brandingTheme || brandingTheme.organizationId !== organization.id) {
          setBrandingTheme(themeWithOrgId);
          
          // Cache the initial theme with organization ID
          try {
            localStorage.setItem('organization-branding', JSON.stringify(themeWithOrgId));
          } catch (error) {
            console.warn('Failed to cache initial branding theme:', error);
          }
        }
      }
      setInitialThemeSet(true);
    }
  }, [organization, orgLoading, getInitialTheme, initialThemeSet, brandingTheme]);

  // Use the useOrganizationBranding hook instead of making direct API calls
  const { branding: hookBranding, loading: hookBrandingLoading } = useOrganizationBranding();

  // Update theme when branding from hook changes
  useEffect(() => {
    // Skip if organization is still loading or initial theme not set
    if (orgLoading || !initialThemeSet || hookBrandingLoading) {
      setBrandingLoading(hookBrandingLoading);
      return;
    }

    // If no organization, use default branding
    if (!organization) {
      console.log('🎨 ThemeProvider: No organization, using default branding');
      setBrandingTheme(null);
      setBrandingLoading(false);
      return;
    }

    console.log('🎨 ThemeProvider: Using branding from hook for organization:', organization.name);
    setBrandingLoading(false);

    if (hookBranding) {
      // Convert hook branding to theme format
      const normalized: BrandingTheme = {
        primaryColor: hookBranding.primary_color || '#0f172a',
        secondaryColor: hookBranding.secondary_color || '#64748b',
        accentColor: hookBranding.accent_color || '#2563eb',
        fontFamily: hookBranding.font_family || 'Inter, system-ui, sans-serif',
        logoUrl: hookBranding.logo_url || undefined,
        faviconUrl: undefined,
        organizationId: organization.id,
      };

      setBrandingTheme(normalized);

      // Cache the theme in localStorage
      try {
        localStorage.setItem('organization-branding', JSON.stringify(normalized));
        console.log('🎨 ThemeProvider: Cached updated branding theme');
      } catch (error) {
        console.warn('Failed to cache branding theme:', error);
      }
    } else {
      // No custom branding, check if this is Withcar for default brand
      const orgSlug = organization?.slug?.toLowerCase();
      const orgName = organization?.name?.toLowerCase();
      const WITHCAR_ORG_ID = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
      const isWithcar = organization.id === WITHCAR_ORG_ID ||
                        orgSlug === 'withcar' || 
                        orgName === 'withcar';
      
      if (isWithcar) {
        setBrandingTheme(withcarDefaultBrand);
      } else {
        setBrandingTheme(null);
      }
    }
  }, [organization, orgLoading, initialThemeSet, hookBranding, hookBrandingLoading, withcarDefaultBrand]);


  
  // Apply custom CSS variables
  useEffect(() => {
    if (brandingTheme) {
      // Get current CSS variable values to prevent unnecessary updates
      const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
      const currentSecondary = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
      const currentAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
      const currentFont = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();
      
      // Only update if values actually changed
      if (currentPrimary !== brandingTheme.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', brandingTheme.primaryColor);
      }
      if (currentSecondary !== brandingTheme.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', brandingTheme.secondaryColor);
      }
      if (currentAccent !== brandingTheme.accentColor) {
        document.documentElement.style.setProperty('--accent-color', brandingTheme.accentColor);
      }
      if (currentFont !== brandingTheme.fontFamily) {
        document.documentElement.style.setProperty('--font-family', brandingTheme.fontFamily);
      }

      // Gradient stops - only update if accent color changed
      if (currentAccent !== brandingTheme.accentColor) {
        document.documentElement.style.setProperty('--brand-start', brandingTheme.accentColor);
        document.documentElement.style.setProperty('--brand-mid', brandingTheme.accentColor);
        document.documentElement.style.setProperty('--brand-end', brandingTheme.accentColor);
      }
    }
  }, [brandingTheme]);

  // Simple favicon handling - only for custom branding
  useEffect(() => {
    if (brandingTheme?.faviconUrl) {
      const existingCustom = document.querySelector('link[data-custom-favicon]');
      if (existingCustom) {
        existingCustom.remove();
      }
      
      const customIcon = document.createElement('link');
      customIcon.rel = 'icon';
      customIcon.href = brandingTheme.faviconUrl;
      customIcon.setAttribute('data-custom-favicon', 'true');
      document.head.appendChild(customIcon);
    }
  }, [brandingTheme?.faviconUrl]);
  
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
