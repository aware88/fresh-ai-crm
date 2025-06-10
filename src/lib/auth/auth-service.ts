import { createSupabaseClient } from '../supabase/client';
import { User, Session } from '@supabase/supabase-js';

/**
 * Authentication service using Supabase
 */
export const AuthService = {
  /**
   * Get the current user session
   */
  async getSession(): Promise<Session | null> {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return null;

      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Get the current user
   */
  async getUser(): Promise<User | null> {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return null;

      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<boolean> {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return false;

      const { error } = await supabase.auth.signOut();
      return !error;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  },

  /**
   * Check if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }
};
