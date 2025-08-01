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
  // 🚨 EMERGENCY DISABLE: Skip organization branding to fix sign-in
  console.log('🚨 ThemeProvider: Skipping organization branding to fix sign-in');
  
  const [brandingTheme, setBrandingTheme] = useState<BrandingTheme | null>(null);
  
  // Skip organization branding fetch for now
  
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
