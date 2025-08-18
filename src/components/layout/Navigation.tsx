'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Bell, User, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { signOut } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className = '' }: NavigationProps) {
  const { organization, loading: orgLoading } = useOrganization();
  const { branding, loading: brandingLoading } = useOrganizationBranding();
  
  // Get derived values from branding
  const logoPath = branding?.logo_url || null;
  const companyName = organization?.slug?.toLowerCase() === 'withcar' || 
                     organization?.name?.toLowerCase() === 'withcar' ? 'WITHCAR' : 
                     organization?.name || 'ARIS';
  

  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={`bg-white shadow-sm border-b h-16 flex items-center px-4 sm:px-6 ${className}`}>
      <div className="flex items-center justify-between w-full">
        {/* Logo on the left side */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            {(orgLoading || brandingLoading) ? (
              // Loading state for logo
              <div className="flex items-center">
                <div className="h-8 w-8 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
                </div>
                <div className="ml-2 animate-pulse bg-gray-200 rounded w-16 h-4"></div>
              </div>
            ) : companyName === 'WITHCAR' ? (
              // For Withcar, show only the logo (which contains the text)
              <div className="h-8 w-auto flex items-center justify-center">
                <Image 
                  src={logoPath || '/images/organizations/withcar-logo.png'} 
                  alt="WITHCAR Logo" 
                  width={80}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              // For other organizations, show logo + text
              <div className="flex items-center">
                <div className="h-8 w-8 flex items-center justify-center overflow-hidden">
                  {logoPath ? (
                    <Image 
                      src={logoPath} 
                      alt={`${companyName} Logo`} 
                      width={32}
                      height={32}
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <Image 
                      src="/images/aris-logo.svg" 
                      alt="ARIS Logo" 
                      width={32}
                      height={32}
                      className="object-contain" 
                      priority
                    />
                  )}
                </div>
                <span className="ml-2 font-semibold text-md bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                  {companyName}
                </span>
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