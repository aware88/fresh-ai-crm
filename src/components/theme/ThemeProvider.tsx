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
  const { organization } = useOrganization();
  const [brandingTheme, setBrandingTheme] = useState<BrandingTheme | null>(null);
  
  // Fetch organization branding
  useEffect(() => {
    const fetchBranding = async () => {
      if (!organization?.id) return;
      
      try {
        const response = await fetch(`/api/organizations/${organization.id}/branding`);
        if (response.ok) {
          const data = await response.json();
          if (data.branding) {
            setBrandingTheme({
              primaryColor: data.branding.primary_color || '#0f172a',
              secondaryColor: data.branding.secondary_color || '#64748b',
              accentColor: data.branding.accent_color || '#2563eb',
              fontFamily: data.branding.font_family || 'Inter, system-ui, sans-serif',
              logoUrl: data.branding.logo_url,
              faviconUrl: data.branding.favicon_url
            });
          }
        }
      } catch (error) {
        console.error('Error fetching organization branding:', error);
      }
    };
    
    fetchBranding();
  }, [organization?.id]);
  
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
