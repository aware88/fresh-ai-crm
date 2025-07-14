'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
// Define a simplified user type that matches our needs
type User = {
  id: string;
  email: string;
  // Add other user properties as needed
};
import { AuthService } from '@/lib/auth/auth-service';
import PublicLayout from './public/PublicLayout';
import AuthenticatedLayout from './auth/AuthenticatedLayout';
import { withAuth } from '@/lib/auth/auth-middleware';
import AuthProvider from '@/components/auth/AuthProvider';

// List of public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/signin', '/signup', '/auth/callback'];

interface LayoutProviderProps {
  children: React.ReactNode;
}

function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname() || '/';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthService.isAuthenticated();
      setUser(authStatus ? { id: '1', email: 'user@example.com' } : null);
      setLoading(false);
    };

    checkAuth();
  }, []);

  // While checking authentication status, render nothing or a loading screen
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading...</div>;
  }

  // --- For /settings and subpages, just wrap with AuthProvider ---
  // Let the individual settings pages handle their own auth checks
  if (pathname.startsWith('/settings')) {
    return <AuthProvider>{children}</AuthProvider>;
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
