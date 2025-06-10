'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth/auth-service';
import PublicLayout from './public/PublicLayout';
import AuthenticatedLayout from './auth/AuthenticatedLayout';
import { withAuth } from '@/lib/auth/auth-middleware';

// List of public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/signin', '/signup', '/auth/callback'];

interface LayoutProviderProps {
  children: React.ReactNode;
}

function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname() || '/';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // While checking authentication status, render nothing or a loading screen
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>;
  }

  // Determine if the current path is public
  const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/auth/');
  
  // Use PublicLayout for public paths or when not authenticated
  if (isPublicPath) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // Use AuthenticatedLayout for authenticated users on protected paths
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

// Apply auth middleware to the LayoutProvider
export default withAuth(LayoutProvider);
