'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { BrandingTheme } from '@/types/branding';
import { useOrganization } from '@/hooks/useOrganization';

interface ThemeProviderProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { organization, loading: orgLoading } = useOrganization();
  const [brandingTheme, setBrandingTheme] = useState<BrandingTheme | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(false);

  // Fetch organization branding
  useEffect(() => {
    const fetchBranding = async () => {
      // Skip if organization is still loading
      if (orgLoading) {
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
            setBrandingTheme(null);
            return;
          }
          throw new Error(`Failed to fetch branding: ${response.status}`);
        }
        
        const branding = await response.json();
        console.log('🎨 ThemeProvider: Applied organization branding');
        setBrandingTheme(branding);
        
      } catch (error) {
        console.error('🎨 ThemeProvider: Error fetching branding:', error);
        // On error, use default branding
        setBrandingTheme(null);
      } finally {
        setBrandingLoading(false);
      }
    };

    fetchBranding();
  }, [organization, orgLoading]);
  
  // Apply custom CSS variables
  useEffect(() => {
    if (brandingTheme) {
      document.documentElement.style.setProperty('--primary-color', brandingTheme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', brandingTheme.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', brandingTheme.accentColor);
      document.documentElement.style.setProperty('--font-family', brandingTheme.fontFamily);
      
      // Update favicon if provided
      if (brandingTheme.faviconUrl) {
        const existingFavicon = document.querySelector('link[rel="icon"]');
        if (existingFavicon) {
          existingFavicon.setAttribute('href', brandingTheme.faviconUrl);
        } else {
          const favicon = document.createElement('link');
          favicon.rel = 'icon';
          favicon.href = brandingTheme.faviconUrl;
          document.head.appendChild(favicon);
        }
      }
    }
  }, [brandingTheme]);
  
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
