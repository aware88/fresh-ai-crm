'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bell, User, Brain } from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className = '' }: NavigationProps) {
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('CRM Mind');
  
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
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <div className="h-8 w-auto mr-2 relative">
              {logoPath ? (
                <img 
                  src={logoPath} 
                  alt="Company Logo" 
                  className="h-full w-auto object-contain"
                />
              ) : (
                <div className="flex items-center">
                  <Brain className="h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-xl font-bold text-blue-600">CRM Mind</span>
                </div>
              )}
            </div>
            {companyName && (
              <span className="ml-2 text-base font-medium text-gray-900">
                {companyName}
              </span>
            )}
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            className="p-2 rounded-full hover:bg-gray-100 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative">
            <button 
              type="button" 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm">
                <User className="h-4 w-4" />
              </div>
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Settings
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                    Sign out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
