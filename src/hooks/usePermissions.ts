import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useSession } from 'next-auth/react';

type Permission = {
  resource_type: string;
  action: string;
};

type PermissionKey = `${string}:${string}`;

export function usePermissions() {
  const supabase = createClientComponentClient<Database>();
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Set<PermissionKey>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user?.id) {
        setPermissions(new Set());
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Call the RPC function to get user permissions
        const { data, error } = await supabase.rpc('get_user_permissions', {
          p_user_id: session.user.id
        });

        if (error) throw error;

        // Convert permissions to a set of keys for easy lookup
        const permissionSet = new Set<PermissionKey>();
        (data || []).forEach((permission: Permission) => {
          permissionSet.add(`${permission.resource_type}:${permission.action}`);
        });

        setPermissions(permissionSet);
        setError(null);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [session?.user?.id, supabase]);

  /**
   * Check if the user has a specific permission
   */
  const hasPermission = (resourceType: string, action: string): boolean => {
    // System admins have all permissions
    if (session?.user?.is_admin) return true;
    
    const key: PermissionKey = `${resourceType}:${action}`;
    return permissions.has(key);
  };

  /**
   * Check if the user has any of the specified permissions
   */
  const hasAnyPermission = (permissionChecks: Array<[string, string]>): boolean => {
    // System admins have all permissions
    if (session?.user?.is_admin) return true;
    
    return permissionChecks.some(([resourceType, action]) => {
      return hasPermission(resourceType, action);
    });
  };

  /**
   * Check if the user has all of the specified permissions
   */
  const hasAllPermissions = (permissionChecks: Array<[string, string]>): boolean => {
    // System admins have all permissions
    if (session?.user?.is_admin) return true;
    
    return permissionChecks.every(([resourceType, action]) => {
      return hasPermission(resourceType, action);
    });
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
