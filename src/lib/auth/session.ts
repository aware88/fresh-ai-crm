/**
 * Session management utilities
 * 
 * This module provides functions for managing user sessions and authentication.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

/**
 * Get the current user session from a request
 */
export async function getSession() {
  const supabase = await createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user ID from a request
 */
export async function getUID() {
  const supabase = await createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
}
