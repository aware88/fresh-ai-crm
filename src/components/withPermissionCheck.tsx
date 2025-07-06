import { useRouter } from 'next/router';
import React, { ComponentType } from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface WithPermissionCheckOptions {
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Higher-order component that protects routes based on user permissions
 * 
 * @param Component - The component to wrap with permission checks
 * @param options - Configuration options for permission checking
 * @returns A wrapped component that checks permissions before rendering
 */
export const withPermissionCheck = <P extends object>(
  Component: ComponentType<P>,
  options: WithPermissionCheckOptions
) => {
  const { 
    permission, 
    anyPermission, 
    allPermissions, 
    redirectTo = '/unauthorized',
    fallback = null 
  } = options;

  const WithPermissionCheck: React.FC<P> = (props) => {
    const router = useRouter();
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();
    
    // Wait for permissions to load
    if (loading) {
      return <div>Loading...</div>;
    }
    
    // Check permissions
    let hasAccess = true;
    
    if (permission && !hasPermission(permission)) {
      hasAccess = false;
    }
    
    if (anyPermission && !hasAnyPermission(anyPermission)) {
      hasAccess = false;
    }
    
    if (allPermissions && !hasAllPermissions(allPermissions)) {
      hasAccess = false;
    }
    
    // Handle unauthorized access
    if (!hasAccess) {
      if (redirectTo) {
        // Use setTimeout to avoid React state updates during render
        setTimeout(() => {
          router.push(redirectTo);
        }, 0);
        return null;
      }
      
      return <>{fallback}</>;
    }
    
    // User has permission, render the component
    return <Component {...props} />;
  };
  
  return WithPermissionCheck;
};

/**
 * Example usage:
 * 
 * const ProtectedPage = withPermissionCheck(MyPage, {
 *   permission: 'organization.settings.view',
 *   redirectTo: '/dashboard'
 * });
 */
