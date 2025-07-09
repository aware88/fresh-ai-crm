'use client';

import { useState, useEffect } from 'react';
import { Organization } from '@/types/organizations';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';

interface UseOrganizationResult {
  organization: Organization | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to get the current user's organization
 * 
 * This hook fetches the current user's organization from Supabase
 * and provides loading and error states.
 */
export function useOrganization(): UseOrganizationResult {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: nextAuthSession, status } = useSession();

  // No need for a separate effect to get the session as useSession handles that
  
  useEffect(() => {
    async function fetchOrganization() {
      if (status === 'loading') {
        return; // Wait for session to load
      }
      
      if (status === 'unauthenticated' || !nextAuthSession?.user) {
        setLoading(false);
        return;
      }

      try {
        // Get user ID from NextAuth session
        const userId = nextAuthSession.user.id;
        
        if (!userId) {
          throw new Error('User ID not found in session');
        }
        
        // First, get the user's current organization_id from user_preferences
        const { data: userPrefs, error: userPrefsError } = await supabase
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', userId)
          .single();

        if (userPrefsError) throw userPrefsError;

        if (!userPrefs?.current_organization_id) {
          // If no current organization is set, get the first organization the user is a member of
          const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)
            .limit(1)
            .single();

          if (memberError && memberError.code !== 'PGRST116') throw memberError;

          if (memberData?.organization_id) {
            // Get the organization details
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', memberData.organization_id)
              .single();

            if (orgError) throw orgError;
            setOrganization(orgData);
          }
        } else {
          // Get the organization details for the current organization
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userPrefs.current_organization_id)
            .single();

          if (orgError) throw orgError;
          setOrganization(orgData);
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [nextAuthSession, status, supabase]);

  return { organization, loading, error };
}
