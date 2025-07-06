import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from 'next-auth/react';

type PermissionGateProps = {
  /**
   * The resource type to check permission for (e.g., 'contact', 'organization')
   */
  resourceType: string;
  
  /**
   * The action to check permission for (e.g., 'read', 'create', 'update', 'delete')
   */
  action: string;
  
  /**
   * Multiple permission checks. If provided, will override resourceType and action.
   * Format: [[resourceType, action], [resourceType, action], ...]
   */
  permissions?: Array<[string, string]>;
  
  /**
   * If true, the user must have ALL specified permissions.
   * If false (default), the user must have ANY of the specified permissions.
   */
  requireAll?: boolean;
  
  /**
   * Content to render if the user has the required permissions
   */
  children: React.ReactNode;
  
  /**
   * Optional content to render if the user doesn't have the required permissions
   */
  fallback?: React.ReactNode;
  
  /**
   * If true, the component will not render anything while permissions are loading
   */
  waitForPermissions?: boolean;
};

/**
 * A component that conditionally renders its children based on user permissions
 */
export function PermissionGate({
  resourceType,
  action,
  permissions,
  requireAll = false,
  children,
  fallback = null,
  waitForPermissions = true,
}: PermissionGateProps) {
  const { data: session } = useSession();
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();
  
  // If not authenticated, show fallback
  if (!session) {
    return <>{fallback}</>;
  }
  
  // If permissions are still loading and we're configured to wait
  if (loading && waitForPermissions) {
    return null;
  }
  
  // Check permissions
  let hasAccess = false;
  
  if (permissions) {
    // Check multiple permissions
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // Check single permission
    hasAccess = hasPermission(resourceType, action);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * A component that only renders its children if the user is an admin
 */
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { data: session } = useSession();
  
  if (session?.user?.is_admin) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
