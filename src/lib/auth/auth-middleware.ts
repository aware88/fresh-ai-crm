'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthService } from './auth-service';
import React from 'react';

// List of public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/signin', '/signup', '/auth/callback'];

/**
 * Authentication middleware component that protects routes
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  // Define the AuthProtected component with the same props as the original component
  const AuthProtected = (props: P) => {
    const router = useRouter();
    const pathname = usePathname() || '/';
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        const isPublicPath = PUBLIC_PATHS.includes(pathname) || 
                            pathname.startsWith('/auth/') || 
                            pathname.includes('reset-password');
        
        // Don't check for authentication on public paths
        if (isPublicPath) {
          setLoading(false);
          return;
        }

        const isAuthenticated = await AuthService.isAuthenticated();
        
        if (!isAuthenticated && !isPublicPath) {
          // Redirect to sign in page if not authenticated and trying to access protected route
          router.push('/signin');
          return;
        }
        
        setAuthenticated(isAuthenticated);
        setLoading(false);
      };

      checkAuth();
    }, [pathname, router]);

    // Show nothing while checking authentication
    if (loading) {
      return null;
    }

    // If we're on a private page and not authenticated, don't render anything
    // (the useEffect will handle the redirect)
    const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/auth/');
    if (!isPublicPath && !authenticated) {
      return null;
    }

    // Otherwise, render the protected component
    return React.createElement(Component, props);
  };

  return AuthProtected;
}
