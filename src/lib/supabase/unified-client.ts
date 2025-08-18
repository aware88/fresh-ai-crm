/**
 * UNIFIED SUPABASE CLIENT
 * 
 * Backward-compatible wrapper that routes all Supabase client requests
 * through the UnifiedClientManager for optimized performance.
 * 
 * This file maintains all existing import patterns while providing
 * the benefits of the unified client manager.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { clientManager } from '../clients/unified-client-manager';

/**
 * Create anonymous Supabase client
 * Backward compatible with: import { createClient } from '@supabase/supabase-js'
 */
export const createClient = (): SupabaseClient<Database> => {
  try {
    return clientManager.getSupabaseClient('anon');
  } catch (error) {
    console.warn('[UnifiedSupabaseClient] Failed to get unified client, using fallback:', error);
    // Fallback to direct client creation
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
};

/**
 * Create server-side Supabase client
 * Backward compatible with: import { createServerClient } from '@/lib/supabase/server'
 */
export const createServerClient = (): SupabaseClient<Database> => {
  try {
    return clientManager.getSupabaseClient('server');
  } catch (error) {
    console.warn('[UnifiedSupabaseClient] Failed to get unified server client, using fallback:', error);
    // Fallback to direct client creation
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
};

/**
 * Create service role Supabase client
 * Backward compatible with: import { createServiceRoleClient } from '@/lib/supabase/service-role'
 */
export const createServiceRoleClient = (): SupabaseClient<Database> => {
  try {
    return clientManager.getSupabaseClient('service');
  } catch (error) {
    console.warn('[UnifiedSupabaseClient] Failed to get unified service client, using fallback:', error);
    // Fallback to direct client creation
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
};

// Export the client manager for advanced usage
export { clientManager };

// Re-export types for convenience
export type { Database };


