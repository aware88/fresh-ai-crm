'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Global Theme Provider - Applies organization branding to entire app
 * 
 * Features:
 * 1. Applies organization colors from settings to CSS variables
 * 2. Updates in real-time when admin changes colors
 * 3. Falls back to ARIS defaults for new organizations
 * 4. Works across ALL pages and components
 * 5. Listens for branding update events from settings
 */

interface OrganizationBranding {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  logo_url?: string;
  organization_name?: string;
}

// ARIS Default Colors - Updated to new ARIS design system
const ARIS_DEFAULTS = {
  primary: '#0099FF',      // New ARIS Blue hsl(210 100% 50%)
  secondary: '#66B3FF',    // Lighter ARIS Blue
  dark: '#0077CC',         // Darker ARIS Blue
  gradientStart: '#0099FF', // ARIS gradient start
  gradientEnd: '#66B3FF',   // ARIS gradient end
};

// Predefined organization themes (for organizations with custom branding)
const ORGANIZATION_THEMES: Record<string, any> = {
  'withcar': {
    primary: '#ea580c',      // Withcar Orange
    secondary: '#fb923c',    // Light Orange
    dark: '#c2410c',         // Dark Orange
    gradientStart: '#ea580c',
    gradientEnd: '#fb923c',
  },
  'bulk-nutrition': {
    primary: '#059669',      // Green
    secondary: '#34d399',    // Light Green
    dark: '#047857',         // Dark Green
    gradientStart: '#059669',
    gradientEnd: '#34d399',
  }
};

export default function GlobalThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const applyThemeColors = (colors: any) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Apply all brand colors to CSS variables
    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--brand-secondary', colors.secondary);
    root.style.setProperty('--brand-dark', colors.dark);
    root.style.setProperty('--brand-gradient-start', colors.gradientStart);
    root.style.setProperty('--brand-gradient-end', colors.gradientEnd);

    // Also update legacy CSS variables for backward compatibility
    root.style.setProperty('--color-accent', colors.primary);
    root.style.setProperty('--accent-color', colors.primary);
    root.style.setProperty('--primary-color', colors.primary);

    console.log('🎨 GlobalThemeProvider: Applied theme colors:', colors);
  };

  useEffect(() => {
    if (status === 'loading') return;

    let themeColors = ARIS_DEFAULTS;

    if (status === 'authenticated' && session?.organizationBranding) {
      const branding = session.organizationBranding;
      
      // Check if organization has custom colors set in settings
      if (branding.primary_color || branding.secondary_color || branding.accent_color) {
        // Use custom colors from organization settings
        themeColors = {
          primary: branding.primary_color || branding.accent_color || ARIS_DEFAULTS.primary,
          secondary: branding.secondary_color || ARIS_DEFAULTS.secondary,
          dark: adjustColorBrightness(branding.primary_color || branding.accent_color || ARIS_DEFAULTS.primary, -20),
          gradientStart: branding.primary_color || branding.accent_color || ARIS_DEFAULTS.primary,
          gradientEnd: branding.secondary_color || ARIS_DEFAULTS.secondary,
        };
        console.log('🎨 GlobalThemeProvider: Using custom organization colors');
      } else {
        // Check if organization has a predefined theme
        const orgName = (branding.organization_name || branding.name || '')
          .toLowerCase().replace(/\s+/g, '-');
        
        if (ORGANIZATION_THEMES[orgName]) {
          themeColors = ORGANIZATION_THEMES[orgName];
          console.log('🎨 GlobalThemeProvider: Using predefined theme for:', orgName);
        } else {
          console.log('🎨 GlobalThemeProvider: Using ARIS defaults for organization:', orgName);
        }
      }
    } else {
      console.log('🎨 GlobalThemeProvider: Using ARIS defaults (not authenticated)');
    }

    applyThemeColors(themeColors);
  }, [session, status]);

  // Listen for branding updates from settings page
  useEffect(() => {
    const handleBrandingUpdate = (event: CustomEvent) => {
      const { branding } = event.detail;
      
      if (branding.primary_color || branding.secondary_color || branding.accent_color) {
        const updatedColors = {
          primary: branding.primary_color || branding.accent_color || ARIS_DEFAULTS.primary,
          secondary: branding.secondary_color || ARIS_DEFAULTS.secondary,
          dark: adjustColorBrightness(branding.primary_color || branding.accent_color || ARIS_DEFAULTS.primary, -20),
          gradientStart: branding.primary_color || branding.accent_color || ARIS_DEFAULTS.primary,
          gradientEnd: branding.secondary_color || ARIS_DEFAULTS.secondary,
        };
        
        applyThemeColors(updatedColors);
        console.log('🎨 GlobalThemeProvider: Updated colors from settings:', updatedColors);
      } else {
        // Reset to defaults if colors are cleared
        applyThemeColors(ARIS_DEFAULTS);
        console.log('🎨 GlobalThemeProvider: Reset to ARIS defaults');
      }
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    };
  }, []);

  return <>{children}</>;
}

/**
 * Utility function to adjust color brightness
 * @param color - Hex color string
 * @param percent - Percentage to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
function adjustColorBrightness(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB values
  const num = parseInt(hex, 16);
  const r = (num >> 16) + percent;
  const g = (num >> 8 & 0x00FF) + percent;
  const b = (num & 0x0000FF) + percent;
  
  // Ensure values stay within 0-255 range
  const newR = Math.max(0, Math.min(255, r));
  const newG = Math.max(0, Math.min(255, g));
  const newB = Math.max(0, Math.min(255, b));
  
  return `#${(newR << 16 | newG << 8 | newB).toString(16).padStart(6, '0')}`;
}
