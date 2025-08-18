import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ARIS - AI CRM',
  description: 'Agentic Relationship Intelligence System',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function applyTheme() {
                  try {
                    // Apply cached theme immediately to prevent flash
                    var cached = localStorage.getItem('organization-branding');
                    if (cached) {
                      var theme = JSON.parse(cached);
                      if (theme.organizationId && theme.accentColor) {
                        console.log('🎨 Immediate theme application: Using cached theme');
                        document.documentElement.style.setProperty('--accent-color', theme.accentColor);
                        document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
                        document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
                        document.documentElement.style.setProperty('--font-family', theme.fontFamily);
                        document.documentElement.style.setProperty('--brand-start', theme.accentColor);
                        document.documentElement.style.setProperty('--brand-mid', theme.accentColor);
                        document.documentElement.style.setProperty('--brand-end', theme.accentColor);
                        return;
                      }
                    }
                    
                    // Try to detect organization from user preferences in localStorage
                    var userPrefs = localStorage.getItem('user-preferences');
                    if (userPrefs) {
                      try {
                        var prefs = JSON.parse(userPrefs);
                        if (prefs.current_organization_id) {
                          // Check if this is the Withcar organization ID
                          if (prefs.current_organization_id === '577485fb-50b4-4bb2-a4c6-54b97e1545ad') {
                            console.log('🎨 Immediate theme application: Detected Withcar from user prefs');
                            document.documentElement.style.setProperty('--accent-color', '#ff6a00');
                            document.documentElement.style.setProperty('--primary-color', '#111111');
                            document.documentElement.style.setProperty('--secondary-color', '#1f2937');
                            document.documentElement.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');
                            document.documentElement.style.setProperty('--brand-start', '#ff6a00');
                            document.documentElement.style.setProperty('--brand-mid', '#ff6a00');
                            document.documentElement.style.setProperty('--brand-end', '#ff6a00');
                            return;
                          } else {
                            // This is NOT Withcar, apply blue theme immediately
                            console.log('🎨 Immediate theme application: Non-Withcar org detected, applying blue theme');
                            document.documentElement.style.setProperty('--accent-color', '#2563eb');
                            document.documentElement.style.setProperty('--primary-color', '#0f172a');
                            document.documentElement.style.setProperty('--secondary-color', '#64748b');
                            document.documentElement.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');
                            document.documentElement.style.setProperty('--brand-start', '#2563eb');
                            document.documentElement.style.setProperty('--brand-mid', '#2563eb');
                            document.documentElement.style.setProperty('--brand-end', '#2563eb');
                            return;
                          }
                        }
                      } catch (e) {
                        console.warn('Failed to parse user preferences:', e);
                      }
                    }
                    
                    // Fallback: detect Withcar from URL path
                    var pathname = window.location.pathname;
                    if (pathname.includes('/withcar') || pathname.includes('withcar')) {
                      console.log('🎨 Immediate theme application: Detected Withcar from URL path');
                      document.documentElement.style.setProperty('--accent-color', '#ff6a00');
                      document.documentElement.style.setProperty('--primary-color', '#111111');
                      document.documentElement.style.setProperty('--secondary-color', '#1f2937');
                      document.documentElement.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');
                      document.documentElement.style.setProperty('--brand-start', '#ff6a00');
                      document.documentElement.style.setProperty('--brand-mid', '#ff6a00');
                      document.documentElement.style.setProperty('--brand-end', '#ff6a00');
                    } else {
                      console.log('🎨 Immediate theme application: No Withcar detected, using default blue theme');
                      // Override the CSS defaults for non-Withcar organizations
                      document.documentElement.style.setProperty('--accent-color', '#2563eb');
                      document.documentElement.style.setProperty('--primary-color', '#0f172a');
                      document.documentElement.style.setProperty('--secondary-color', '#64748b');
                      document.documentElement.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');
                      document.documentElement.style.setProperty('--brand-start', '#2563eb');
                      document.documentElement.style.setProperty('--brand-mid', '#2563eb');
                      document.documentElement.style.setProperty('--brand-end', '#2563eb');
                    }
                  } catch (e) {
                    console.warn('Failed to apply immediate theme:', e);
                  }
                }
                
                // Apply theme immediately
                applyTheme();
                
                // Also apply theme when user preferences might be updated
                var checkInterval = setInterval(function() {
                  if (localStorage.getItem('user-preferences')) {
                    clearInterval(checkInterval);
                    applyTheme();
                  }
                }, 100);
                
                // Stop checking after 5 seconds
                setTimeout(function() {
                  clearInterval(checkInterval);
                }, 5000);
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}