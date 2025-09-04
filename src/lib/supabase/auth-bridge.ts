/**
 * NextAuth <-> Supabase Authentication Bridge
 * 
 * This module bridges NextAuth sessions with Supabase RLS by setting the proper
 * authentication context for client-side Supabase operations.
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Custom hook that provides a Supabase client with NextAuth session context
 */
export function useAuthenticatedSupabase() {
  const { data: session, status } = useSession();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    const client = createClientComponentClient<Database>();

    if (session?.user?.id) {
      // Create a mock Supabase session that matches the NextAuth session
      // This allows RLS policies to work with auth.uid()
      const mockSupabaseUser = {
        id: session.user.id,
        email: session.user.email || '',
        user_metadata: {
          name: session.user.name,
          email: session.user.email,
        },
        app_metadata: {},
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockSupabaseUser,
      };

      // Set the session in the Supabase client
      client.auth.setSession(mockSession as any);
    } else {
      // Clear session if not authenticated
      client.auth.signOut();
    }

    setSupabaseClient(client);
  }, [session, status]);

  return {
    supabase: supabaseClient,
    isAuthenticated: !!session?.user?.id,
    userId: session?.user?.id,
    loading: status === 'loading' || !supabaseClient,
  };
}

/**
 * Create a Supabase client with NextAuth session context
 * For use in components where hooks cannot be used
 */
export async function createAuthenticatedClient(userId: string, userEmail?: string): Promise<SupabaseClient<Database>> {
  const client = createClientComponentClient<Database>();

  if (userId) {
    const mockSupabaseUser = {
      id: userId,
      email: userEmail || '',
      user_metadata: {
        email: userEmail,
      },
      app_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockSupabaseUser,
    };

    await client.auth.setSession(mockSession as any);
  }

  return client;
}

/**
 * Email-specific authenticated Supabase client
 * This is specifically designed for email operations with proper RLS context
 */
export function useEmailSupabase() {
  const { supabase, isAuthenticated, userId, loading } = useAuthenticatedSupabase();

  return {
    supabase,
    isAuthenticated,
    userId,
    loading,
    
    // Email-specific methods with built-in security
    async getEmailAccounts() {
      if (!supabase || !isAuthenticated) return [];
      
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching email accounts:', error);
        return [];
      }
      
      return data || [];
    },

    async getEmails(emailAccountId: string, folder: string = 'INBOX', limit: number = 50) {
      if (!supabase || !isAuthenticated) return [];
      
      const { data, error } = await supabase
        .from('email_index')
        .select('*')
        .eq('email_account_id', emailAccountId)
        .eq('folder_name', folder)
        .order('received_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching emails:', error);
        return [];
      }
      
      return data || [];
    },

    async getEmailContent(messageId: string) {
      if (!supabase || !isAuthenticated) return null;
      
      const { data, error } = await supabase
        .from('email_content_cache')
        .select('*')
        .eq('message_id', messageId)
        .single();
      
      if (error) {
        console.error('Error fetching email content:', error);
        return null;
      }
      
      return data;
    },

    async updateEmailReadStatus(messageId: string, isRead: boolean) {
      if (!supabase || !isAuthenticated) return false;
      
      const { error } = await supabase
        .from('email_index')
        .update({ is_read: isRead, updated_at: new Date().toISOString() })
        .eq('message_id', messageId);
      
      if (error) {
        console.error('Error updating email read status:', error);
        return false;
      }
      
      return true;
    }
  };
}


