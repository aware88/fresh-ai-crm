'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { BrandingTheme } from '@/types/branding';
import { useSession } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  
  // Only fetch organization if user is authenticated
  const shouldFetchOrg = sessionStatus === 'authenticated' && !!session;
  const { organization, loading: orgLoading } = useOrganization();
  
  // Skip organization loading if user is not authenticated
  const effectiveOrgLoading = shouldFetchOrg ? orgLoading : false;
  const effectiveOrganization = shouldFetchOrg ? organization : null;



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

  // Default branding theme for all organizations
  const defaultBrand: BrandingTheme = useMemo(
    () => ({
      // Default neutral theme that works for any organization
      primaryColor: '#0f172a',
      secondaryColor: '#64748b',
      accentColor: '#2563eb',
      fontFamily: "Inter, system-ui, sans-serif",
      logoUrl: undefined,
      faviconUrl: undefined,
      organizationId: undefined,
    }),
    []
  );

    // No hardcoded organization detection - rely purely on API branding
  const getInitialTheme = useMemo(() => {
    // If user is not authenticated, return null (use default theme)
    if (!shouldFetchOrg) {
      console.log('🔍 ThemeProvider: User not authenticated, using default theme');
      return null;
    }
    
    if (effectiveOrgLoading || !effectiveOrganization) return null;

    // Debug logging for any organization
    console.log('🔍 ThemeProvider: Organization loaded:', {
      id: effectiveOrganization.id,
      name: effectiveOrganization.name,
      slug: effectiveOrganization.slug
    });

    // Return null to let the branding API handle organization-specific themes
    // This ensures all organizations are treated equally
    console.log('🎨 ThemeProvider: Using API-based branding for organization:', effectiveOrganization.name);
    return null;
  }, [effectiveOrganization, effectiveOrgLoading, shouldFetchOrg]);



  // Load cached theme and manage organization changes
  useEffect(() => {
    // Skip if user is not authenticated
    if (!shouldFetchOrg) {
      console.log('🔍 ThemeProvider: User not authenticated, clearing theme');
      setBrandingTheme(null);
      setInitialThemeSet(true);
      return;
    }

    if (!effectiveOrgLoading && effectiveOrganization) {
      console.log('🔄 ThemeProvider: Organization loaded:', effectiveOrganization.name, effectiveOrganization.id);
      
      // Only clear cache if organization actually changed
      const cachedOrgId = brandingTheme?.organizationId;
      if (cachedOrgId && cachedOrgId !== effectiveOrganization.id) {
        console.log('🔄 ThemeProvider: Organization changed, clearing cache');
        localStorage.removeItem('organization-branding');
        setInitialThemeSet(false);
        setBrandingTheme(null);
      } else if (!cachedOrgId) {
        // First time loading this organization
        setInitialThemeSet(false);
      }
    }
  }, [effectiveOrganization?.id, effectiveOrgLoading, brandingTheme?.organizationId, shouldFetchOrg]);

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
      } else {
        // Use default theme for organizations without specific branding
        console.log('🎨 ThemeProvider: Using default theme for', organization.name);
        const themeWithOrgId = {
          ...defaultBrand,
          organizationId: organization.id
        };
        
        if (!brandingTheme || brandingTheme.organizationId !== organization.id) {
          setBrandingTheme(themeWithOrgId);
          
          try {
            localStorage.setItem('organization-branding', JSON.stringify(themeWithOrgId));
          } catch (error) {
            console.warn('Failed to cache default branding theme:', error);
          }
        }
      }
      setInitialThemeSet(true);
    }
  }, [organization, orgLoading, getInitialTheme, initialThemeSet, brandingTheme]);

  // Use the useOrganizationBranding hook instead of making direct API calls
  const { branding: hookBranding, loading: hookBrandingLoading } = useOrganizationBranding();
  
  // Skip branding loading if user is not authenticated
  const effectiveHookBrandingLoading = shouldFetchOrg ? hookBrandingLoading : false;
  const effectiveHookBranding = shouldFetchOrg ? hookBranding : null;

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
      // No custom branding, use default theme for all organizations
      console.log('🎨 No custom branding found, using default theme for:', organization?.name);
      const defaultTheme = {
        ...defaultBrand,
        organizationId: organization?.id
      };
      setBrandingTheme(defaultTheme);
    }
  }, [organization, orgLoading, initialThemeSet, hookBranding, hookBrandingLoading, defaultBrand]);


  
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
