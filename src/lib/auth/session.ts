/**
 * Session management utilities
 * 
 * This module provides functions for managing user sessions and authentication.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { getServerSession as getNextAuthServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

/**
 * Get the current user session from NextAuth
 * This is a wrapper around NextAuth's getServerSession
 * that provides consistent error handling and logging
 */
export async function getServerSession() {
  try {
    const session = await getNextAuthServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('Error getting NextAuth session:', error);
    return null;
  }
}
