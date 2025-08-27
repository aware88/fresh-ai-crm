'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Component that preloads user preferences into localStorage
 * as soon as the session becomes available, enabling immediate theme application
 */
export default function UserPreferencesPreloader() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.currentOrganizationId !== undefined) {
      // Store user preferences in localStorage for immediate theme access
      const userPrefs = {
        current_organization_id: session.currentOrganizationId,
        user_id: session.user.id,
        theme: 'light' // Default theme
      };

      try {
        localStorage.setItem('user-preferences', JSON.stringify(userPrefs));
        console.log('🎨 Preloader: Stored user preferences for immediate theme access:', {
          organizationId: session.currentOrganizationId,
          userId: session.user.id
        });
        
        // Store organization theme slug for immediate theme application
        if (session.organizationBranding) {
          const themeSlug = session.organizationBranding.name.toLowerCase().replace(/\s+/g, '-');
          
          // Store theme slug in localStorage for SSR script
          localStorage.setItem('org-theme', themeSlug);
          console.log('🎨 Preloader: Stored theme slug:', themeSlug, 'for org:', session.organizationBranding.name);
        }
      } catch (error) {
        console.warn('🎨 Preloader: Failed to store user preferences:', error);
      }
    } else if (status === 'unauthenticated') {
      // Clear user preferences when user signs out
      try {
        localStorage.removeItem('user-preferences');
        localStorage.removeItem('org-theme');
        console.log('🎨 Preloader: Cleared user preferences on sign out');
      } catch (error) {
        console.warn('🎨 Preloader: Failed to clear user preferences:', error);
      }
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
