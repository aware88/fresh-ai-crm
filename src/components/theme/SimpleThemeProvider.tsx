'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Simple Theme Provider - Best Practices Applied
 * 
 * Key principles:
 * 1. Single responsibility: Only handles theme switching
 * 2. No complex state management
 * 3. Uses data attributes (fastest DOM method)
 * 4. Minimal re-renders
 * 5. Works on first paint via SSR
 */

// Organization slug to theme mapping
const ORG_THEMES: Record<string, string> = {
  'withcar': 'withcar',
  'bulk-nutrition': 'bulk-nutrition',
  // Easy to extend for new organizations
};

export default function SimpleThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let themeSlug = 'default';

    if (status === 'authenticated' && session?.organizationBranding?.name) {
      // Convert organization name to theme slug
      const orgName = session.organizationBranding.name.toLowerCase().replace(/\s+/g, '-');
      themeSlug = ORG_THEMES[orgName] || 'default';
    }

    // Apply theme via data attribute (most performant method)
    const root = document.documentElement;
    
    // Remove any existing org theme attributes
    Object.values(ORG_THEMES).forEach(theme => {
      root.removeAttribute(`data-org-theme`);
    });

    // Set new theme if not default
    if (themeSlug !== 'default') {
      root.setAttribute('data-org-theme', themeSlug);
      console.log(`🎨 Applied theme: ${themeSlug}`);
    } else {
      console.log('🎨 Using default theme');
    }

  }, [session, status]);

  return <>{children}</>;
}
