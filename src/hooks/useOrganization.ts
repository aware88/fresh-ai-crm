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
/**
 * Creates a default organization object when database queries fail
 * This helps the app continue working even when organization data can't be retrieved
 */
function createDefaultOrganization(userId: string): Organization {
  return {
    id: 'default-org',
    name: 'Default Organization',
    slug: null,
    description: null,
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    domain: null,
    is_active: true,
    subscription_tier: 'free',
    subscription_status: 'active',
    subscription_start_date: null,
    subscription_end_date: null,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

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
      
      // Add a simple fallback to check if we've already tried to fetch an organization
      // and if it failed more than twice, wait before trying again
      const lastAttemptTime = sessionStorage.getItem('lastOrgFetchAttempt');
      const attemptCount = parseInt(sessionStorage.getItem('orgFetchAttemptCount') || '0');
      
      if (lastAttemptTime && attemptCount > 2) {
        const lastTime = parseInt(lastAttemptTime);
        const now = Date.now();
        // If less than 5 seconds since last attempt, wait
        if (now - lastTime < 5000) {
          console.log('Waiting before retrying organization fetch...');
          setTimeout(() => {
            sessionStorage.setItem('lastOrgFetchAttempt', Date.now().toString());
          }, 5000);
          return;
        }
      }
      
      // Record this attempt
      sessionStorage.setItem('lastOrgFetchAttempt', Date.now().toString());
      sessionStorage.setItem('orgFetchAttemptCount', (attemptCount + 1).toString());

      try {
        // Get user ID from NextAuth session
        const userId = nextAuthSession?.user?.id;
        
        console.log('NextAuth session user:', nextAuthSession?.user ? 'present' : 'missing');
        console.log('User ID from session:', userId || 'missing');
        
        if (!userId) {
          throw new Error('User ID not found in session');
        }
        
        // First, get the user's current organization_id from user_preferences
        const { data: userPrefs, error: userPrefsError } = await supabase
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', userId)
          .single();

        // Log query results for debugging
        console.log('User preferences query result:', userPrefs ? 'data found' : 'no data');
        if (userPrefsError) {
          console.warn('User preferences query error:', userPrefsError.message);
          // Don't throw here, continue to fallback
        }

        if (!userPrefs?.current_organization_id) {
          // If no current organization is set, get the first organization the user is a member of
          let memberData, memberError;
          try {
            const result = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', userId);
            memberData = result.data;
            memberError = result.error;
          } catch (queryError) {
            console.warn('Exception during organization_members query:', queryError);
            memberError = queryError;
          }

          // Log query results for debugging
          console.log('Organization members query result:', memberData ? `found ${memberData.length} memberships` : 'no data');
          
          // Handle case when there's an error or no organizations yet
          if (memberError) {
            console.warn('Organization members query error:', memberError.message || memberError, 'Code:', memberError.code);
            // Create a default organization as fallback for any database error
            console.log('Creating default organization due to query error');
            const defaultOrg = createDefaultOrganization(userId);
            setOrganization(defaultOrg);
            return;
          }
          
          // Handle case when user has no organizations yet
          if (!memberData || memberData.length === 0) {
            console.log('User has no organizations yet - creating default organization');
            // Create a default organization for new users
            const defaultOrg = createDefaultOrganization(userId);
            setOrganization(defaultOrg);
            return;
          }
          
          // Get the organization details for the first membership
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', memberData[0].organization_id)
            .single();

          // Log query results for debugging
          console.log('Organization query result:', orgData ? 'data found' : 'no data');
          if (orgError) {
            console.warn('Organization query error:', orgError.message);
            // Don't throw, just log the error and continue without an organization
          } else if (orgData) {
            setOrganization(orgData);
          }
        } else {
          // Get the organization details for the current organization
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userPrefs.current_organization_id)
            .single();

          // Log query results for debugging
          console.log('Current organization query result:', orgData ? 'data found' : 'no data');
          if (orgError) {
            console.warn('Current organization query error:', orgError.message);
            // Don't throw, just log the error and continue without an organization
          } else if (orgData) {
            setOrganization(orgData);
          }
        }
      } catch (err) {
        // Log detailed error information
        console.error('Error fetching organization:');
        if (err instanceof Error) {
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);
        } else {
          console.error('Unknown error type:', typeof err);
          console.error('Error value:', JSON.stringify(err));
        }
        
        // Set a more informative error
        const errorObj = err instanceof Error ? err : new Error(`Failed to fetch organization: ${JSON.stringify(err)}`);
        setError(errorObj);
        
        // Use default organization as fallback to keep the app working
        if (nextAuthSession?.user?.id) {
          console.log('Using default organization as fallback');
          const defaultOrg = createDefaultOrganization(nextAuthSession.user.id);
          setOrganization(defaultOrg);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [nextAuthSession, status, supabase]);

  return { organization, loading, error };
}
