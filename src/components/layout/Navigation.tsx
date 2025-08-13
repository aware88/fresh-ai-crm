'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Bell, User, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { signOut } from 'next-auth/react';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className = '' }: NavigationProps) {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('ARIS');
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Function to load logo and company name from localStorage or API
  const loadLogoAndCompanyName = async () => {
    if (!isBrowser) return;
    
    // Check for logo in localStorage
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogoPath(savedLogo);
    }
    
    // Check for company name in localStorage
    const savedCompanyName = localStorage.getItem('companyName');
    if (savedCompanyName) {
      setCompanyName(savedCompanyName);
    }
    
    // If no logo in localStorage, fetch from API as fallback
    if (!savedLogo) {
      const fetchLogo = async () => {
        try {
          const response = await fetch('/api/logo/get');
          if (response.ok) {
            const data = await response.json();
            if (data.logoPath) {
              setLogoPath(data.logoPath);
              localStorage.setItem('companyLogo', data.logoPath);
            }
          }
        } catch (error) {
          console.error('Error fetching logo:', error);
        }
      };
      
      fetchLogo();
    }
  };
  
  // Listen for storage events (when localStorage is updated in another tab/component)
  useEffect(() => {
    if (!isBrowser) return;
    
    // Initial load
    loadLogoAndCompanyName();
    
    // Create a custom event for same-tab updates
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'companyLogo' || event.key === 'companyName') {
        loadLogoAndCompanyName();
      }
    };
    
    // Add event listener for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Add event listener for our custom event
    window.addEventListener('localStorageUpdated', loadLogoAndCompanyName as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', loadLogoAndCompanyName as EventListener);
    };
  }, [isBrowser]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={`bg-white shadow-sm border-b h-16 flex items-center px-4 sm:px-6 ${className}`}>
      <div className="flex items-center justify-between w-full">
        {/* Remove logo and company name from top nav */}
        <div />
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