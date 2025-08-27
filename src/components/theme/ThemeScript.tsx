/**
 * Server-Side Theme Script - Zero Flash Solution
 * 
 * This script runs BEFORE React hydration to prevent theme flash.
 * It's the most performant approach for multi-tenant theming.
 */

export default function ThemeScript() {
  const script = `
    (function() {
      try {
        // Organization theme mapping (sync with SimpleThemeProvider)
        const ORG_THEMES = {
          'withcar': 'withcar',
          'bulk-nutrition': 'bulk-nutrition'
        };

        // Get theme from localStorage (set by auth system)
        const stored = localStorage.getItem('org-theme');
        if (stored && ORG_THEMES[stored]) {
          document.documentElement.setAttribute('data-org-theme', stored);
          console.log('🎨 SSR: Applied cached theme:', stored);
          return;
        }

        // Fallback: Try to detect from any cached session data
        const sessionData = localStorage.getItem('next-auth.session-token') || 
                            localStorage.getItem('__Secure-next-auth.session-token');
        
        if (sessionData) {
          // For authenticated users, default to checking user preferences
          const userPrefs = localStorage.getItem('user-preferences');
          if (userPrefs) {
            try {
              const prefs = JSON.parse(userPrefs);
              // This will be updated by the auth system, but provides immediate feedback
              console.log('🎨 SSR: User authenticated, theme will load from session');
            } catch (e) {
              console.log('🎨 SSR: Using default theme');
            }
          }
        }

        // Default theme (no data attribute needed)
        console.log('🎨 SSR: Using default theme');
        
      } catch (error) {
        console.warn('🎨 SSR: Theme script error:', error);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      // This script must run before any content renders
    />
  );
}
