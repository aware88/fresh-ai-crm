import { createServiceRoleClient } from './service-role';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Creates a Supabase client that enforces user context for email operations
 * This should be used in all API routes that access email data
 */
export async function createSecureEmailClient() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - no session');
  }

  const supabase = createServiceRoleClient();
  const userId = session.user.id;

  return {
    /**
     * Get emails for the current user
     */
    async getEmails(limit = 50, offset = 0) {
      // First get user's email accounts
      const { data: accounts, error: accountError } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId);

      if (accountError) {
        throw new Error(`Failed to get email accounts: ${accountError.message}`);
      }

      if (!accounts || accounts.length === 0) {
        return { data: [], error: null };
      }

      const accountIds = accounts.map(a => a.id);

      // Then get emails for those accounts
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .in('email_account_id', accountIds)
        .order('received_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return { data, error };
    },

    /**
     * Get a specific email if the user has access
     */
    async getEmail(emailId: string) {
      // First get user's email accounts
      const { data: accounts, error: accountError } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId);

      if (accountError) {
        throw new Error(`Failed to get email accounts: ${accountError.message}`);
      }

      if (!accounts || accounts.length === 0) {
        return { data: null, error: new Error('No email accounts found') };
      }

      const accountIds = accounts.map(a => a.id);

      // Get the email if it belongs to one of the user's accounts
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('id', emailId)
        .in('email_account_id', accountIds)
        .single();

      if (!data && !error) {
        return { data: null, error: new Error('Email not found or access denied') };
      }

      return { data, error };
    },

    /**
     * Create an email for the current user
     */
    async createEmail(email: any) {
      // Verify the email_account_id belongs to the user
      const { data: account, error: accountError } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('id', email.email_account_id)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        throw new Error('Invalid email account or access denied');
      }

      // Create the email
      const { data, error } = await supabase
        .from('emails')
        .insert(email)
        .select()
        .single();

      return { data, error };
    },

    /**
     * Update an email if the user has access
     */
    async updateEmail(emailId: string, updates: any) {
      // First verify the user has access to this email
      const { data: accounts, error: accountError } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId);

      if (accountError) {
        throw new Error(`Failed to get email accounts: ${accountError.message}`);
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No email accounts found');
      }

      const accountIds = accounts.map(a => a.id);

      // Update the email if it belongs to one of the user's accounts
      const { data, error } = await supabase
        .from('emails')
        .update(updates)
        .eq('id', emailId)
        .in('email_account_id', accountIds)
        .select()
        .single();

      if (!data && !error) {
        return { data: null, error: new Error('Email not found or access denied') };
      }

      return { data, error };
    },

    /**
     * Delete an email if the user has access
     */
    async deleteEmail(emailId: string) {
      // First verify the user has access to this email
      const { data: accounts, error: accountError } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', userId);

      if (accountError) {
        throw new Error(`Failed to get email accounts: ${accountError.message}`);
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No email accounts found');
      }

      const accountIds = accounts.map(a => a.id);

      // Delete the email if it belongs to one of the user's accounts
      const { data, error } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId)
        .in('email_account_id', accountIds);

      return { data, error };
    },

    /**
     * Get email accounts for the current user
     */
    async getEmailAccounts() {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    },

    /**
     * Create an email account for the current user
     */
    async createEmailAccount(account: any) {
      const { data, error } = await supabase
        .from('email_accounts')
        .insert({
          ...account,
          user_id: userId
        })
        .select()
        .single();

      return { data, error };
    },

    /**
     * Update an email account if the user owns it
     */
    async updateEmailAccount(accountId: string, updates: any) {
      const { data, error } = await supabase
        .from('email_accounts')
        .update(updates)
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

      if (!data && !error) {
        return { data: null, error: new Error('Email account not found or access denied') };
      }

      return { data, error };
    },

    /**
     * Delete an email account if the user owns it
     */
    async deleteEmailAccount(accountId: string) {
      const { data, error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', userId);

      return { data, error };
    },

    /**
     * Get the raw Supabase client for other operations
     * Use with caution - always validate user access manually
     */
    getClient() {
      return supabase;
    },

    /**
     * Get the current user ID
     */
    getUserId() {
      return userId;
    }
  };
}
