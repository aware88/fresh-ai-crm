import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export interface Permission {
  resource_type: string;
  name: string;
  description: string;
}

export const usePermissions = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all permissions for the current user
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Query to get all permissions for the current user
        const { data, error } = await supabase
          .rpc('get_user_permissions')
          .select('*');

        if (error) throw error;
        
        setPermissions(data || []);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, supabase]);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permissionString: string) => {
      if (!user) return false;
      
      // Check if the permission exists in the user's permissions
      return permissions.some(p => p.resource_type === permissionString);
    },
    [user, permissions]
  );

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback(
    (permissionStrings: string[]) => {
      return permissionStrings.some(p => hasPermission(p));
    },
    [hasPermission]
  );

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback(
    (permissionStrings: string[]) => {
      return permissionStrings.every(p => hasPermission(p));
    },
    [hasPermission]
  );

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
};
