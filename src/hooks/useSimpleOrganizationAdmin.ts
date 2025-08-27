import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Simplified Organization Admin Hook
 * 
 * Uses the organization ID directly from the session instead of 
 * relying on the complex useOrganization hook that may fail.
 */
export function useSimpleOrganizationAdmin() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!session?.user?.id || !session?.currentOrganizationId) {
        setIsAdmin(false);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔐 Simple admin check for org:', session.currentOrganizationId);

        const response = await fetch(`/api/organizations/${session.currentOrganizationId}/members/check-admin`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const isAdminResult = data.isAdmin || false;

        console.log('🔐 Simple admin check result:', isAdminResult, 'role:', data.role);

        setIsAdmin(isAdminResult);
        setLoading(false);

      } catch (err) {
        console.error('Simple admin check failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        setIsAdmin(false);
        setLoading(false);
        setError(errorMessage);
      }
    }

    checkAdminStatus();
  }, [session?.user?.id, session?.currentOrganizationId]);

  return { isAdmin, loading, error };
}
