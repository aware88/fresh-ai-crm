'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Bell, User, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { signOut, useSession } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className = '' }: NavigationProps) {
  const { data: session } = useSession();
  const { organization, loading: orgLoading } = useOrganization();
  const { branding, loading: brandingLoading } = useOrganizationBranding();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  


  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 2000); // 2 second timeout

    return () => clearTimeout(timer);
  }, []);
  
  // Get branding data from session first (immediate), then from API (async)
  const sessionBranding = session?.organizationBranding;
  const effectiveBranding = sessionBranding || branding;
  
  // Get derived values from branding - prefer session data for immediate display
  // Treat empty string, null, or undefined as no custom logo, use default ARIS logo
  const logoPath = effectiveBranding?.logo_url && effectiveBranding.logo_url.trim() !== '' 
    ? effectiveBranding.logo_url 
    : '/images/aris-logo.png'; // Default ARIS logo
  console.log('Navigation: Logo path from effective branding:', logoPath, 'source:', sessionBranding ? 'session' : 'api');
  
  // Company name logic:
  // If using default ARIS logo, always show ARIS for consistency
  // Otherwise, show custom organization name if available
  const hasCustomLogo = effectiveBranding?.logo_url && effectiveBranding.logo_url.trim() !== '';
  const hasCustomCompanyName = effectiveBranding?.organization_name && effectiveBranding.organization_name.trim();
  const hasOrgName = organization?.name && organization.name.trim();
  
  const companyName = hasCustomLogo 
    ? (hasCustomCompanyName 
        ? effectiveBranding.organization_name.trim() 
        : hasOrgName 
          ? organization.name.trim() 
          : 'ARIS')
    : 'ARIS'; // Always show ARIS when no custom logo
      
  // Logo logic: logoPath now always contains either custom logo or default ARIS logo
  const isDefaultARISLogo = logoPath === '/images/aris-logo.png';
  
  // Debug logging for branding data
  console.log('🎨 Navigation: Branding data:', {
    logoPath,
    companyName,
    branding: branding,
    orgLoading,
    brandingLoading,
    loadingTimeout
  });
  
  // Determine if we should show loading state
  const isLoading = (orgLoading || brandingLoading) && !loadingTimeout;
  

  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={`bg-white shadow-sm border-b h-16 flex items-center px-4 sm:px-6 ${className}`}>
      <div className="flex items-center justify-between w-full">
        {/* Logo on the left side */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            {isLoading ? (
              // Loading state for logo
              <div className="flex items-center">
                <div className="h-8 w-8 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
                </div>
                <div className="ml-2 animate-pulse bg-gray-200 rounded w-16 h-4"></div>
              </div>
            ) : (
              // Always show logo (either custom or default ARIS)
              <div className="h-10 w-auto flex items-center justify-center">
                <Image 
                  src={logoPath.startsWith('/') ? `${logoPath}?v=${Date.now()}&t=${Math.random()}` : logoPath}
                  alt={`${companyName} Logo`} 
                  width={120}
                  height={40}
                  className="object-contain"
                  priority
                  onError={(e) => {
                    console.error('🎨 Navigation: Logo failed to load:', logoPath);
                    // Fallback to ARIS text if logo fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded flex items-center justify-center text-white font-bold text-lg">ARIS</div>`;
                    }
                  }}
                />
              </div>
            )}
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            className="p-2 rounded-xl hover:bg-gray-50 relative transition-all duration-200 hover:shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 h-2 w-2 aris-gradient rounded-full"></span>
          </button>
          <div className="relative">
            <button 
              type="button" 
              className="p-1 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-xl aris-gradient flex items-center justify-center text-white text-sm shadow-md">
                <User className="h-4 w-4" />
              </div>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-gray-100 overflow-hidden">
                <div className="py-1">
                  <Link 
                    href="/dashboard/settings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button 
                    onClick={async () => {
                      try {
                        // Sign out from both NextAuth and Supabase
                        await Promise.all([
                          signOut({ redirect: false }),
                          supabase?.auth.signOut()
                        ]);
                        
                        // Clear any cached data
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Force redirect to signin page
                        window.location.href = '/signin';
                      } catch (error) {
                        console.error('Sign out error:', error);
                        // Force redirect even if sign out fails
                        window.location.href = '/signin';
                      }
                    }}
                    className="w-full text-left block px-4 py-2 text-sm font-medium aris-gradient text-white hover:opacity-90 transition-colors duration-150"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}