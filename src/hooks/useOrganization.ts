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
  // 🚨 EMERGENCY DISABLE: Completely disable organization loading to fix sign-in
  console.log('🚨 useOrganization DISABLED - returning safe defaults to fix sign-in');
  
  return {
    organization: null,
    loading: false,
    error: null,
    setOrganization: () => {},
    refreshOrganization: async () => {},
  };
}
