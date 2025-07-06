import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
}

/**
 * PermissionGate - A component that conditionally renders its children based on user permissions
 * 
 * @param children - Content to show when user has the required permissions
 * @param permission - Single permission string to check
 * @param anyPermission - Array of permissions where user needs at least one
 * @param allPermissions - Array of permissions where user needs all
 * @param fallback - Content to show when user doesn't have the required permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  anyPermission,
  allPermissions,
  fallback = null
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  
  // Show nothing while permissions are loading
  if (loading) return null;
  
  // Check permissions based on provided props
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
  
  // Render children if user has access, otherwise render fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
