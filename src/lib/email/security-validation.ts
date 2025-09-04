/**
 * Email Security Validation
 * 
 * Centralized security validation for all email operations
 * Ensures users can ONLY access their own emails
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export interface EmailSecurityContext {
  userId: string;
  session: any;
  supabase: any;
}

export interface EmailAccountValidation {
  valid: boolean;
  accountId?: string;
  userId?: string;
  email?: string;
  providerType?: string;
  error?: string;
}

/**
 * Initialize security context for email operations
 */
export async function initializeEmailSecurity(): Promise<EmailSecurityContext | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    const supabase = createServiceRoleClient();
    
    return {
      userId: session.user.id,
      session,
      supabase
    };
  } catch (error) {
    console.error('Error initializing email security context:', error);
    return null;
  }
}

/**
 * Validate that a user has access to a specific email account
 * CRITICAL: Only returns accounts owned by the user - NO organization sharing
 */
export async function validateEmailAccountAccess(
  accountId: string,
  context?: EmailSecurityContext
): Promise<EmailAccountValidation> {
  try {
    // Initialize context if not provided
    if (!context) {
      context = await initializeEmailSecurity();
      if (!context) {
        return { valid: false, error: 'Unauthorized - no valid session' };
      }
    }

    // Validate account ownership - STRICT user_id check ONLY
    const { data: account, error } = await context.supabase
      .from('email_accounts')
      .select('id, email, user_id, provider_type')
      .eq('id', accountId)
      .eq('user_id', context.userId) // CRITICAL: Only user's own accounts
      .single();

    if (error || !account) {
      console.warn(`Email account access denied for user ${context.userId}, account ${accountId}`);
      return { 
        valid: false, 
        error: 'Email account not found or access denied' 
      };
    }

    return {
      valid: true,
      accountId: account.id,
      userId: account.user_id,
      email: account.email,
      providerType: account.provider_type
    };
  } catch (error) {
    console.error('Error validating email account access:', error);
    return { valid: false, error: 'Internal error validating access' };
  }
}

/**
 * Get all email accounts for the current user
 * CRITICAL: Only returns accounts owned by the user - NO organization sharing
 */
export async function getUserEmailAccounts(
  context?: EmailSecurityContext
): Promise<EmailAccountValidation[]> {
  try {
    // Initialize context if not provided
    if (!context) {
      context = await initializeEmailSecurity();
      if (!context) {
        return [];
      }
    }

    // Get ONLY accounts owned by this specific user
    const { data: accounts, error } = await context.supabase
      .from('email_accounts')
      .select('id, email, user_id, provider_type, is_active')
      .eq('user_id', context.userId) // CRITICAL: Only user's own accounts
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user email accounts:', error);
      return [];
    }

    return (accounts || []).map(account => ({
      valid: true,
      accountId: account.id,
      userId: account.user_id,
      email: account.email,
      providerType: account.provider_type
    }));
  } catch (error) {
    console.error('Error getting user email accounts:', error);
    return [];
  }
}

/**
 * Validate that an email belongs to a user's account
 */
export async function validateEmailAccess(
  messageId: string,
  context?: EmailSecurityContext
): Promise<{ valid: boolean; emailAccountId?: string; error?: string }> {
  try {
    // Initialize context if not provided
    if (!context) {
      context = await initializeEmailSecurity();
      if (!context) {
        return { valid: false, error: 'Unauthorized - no valid session' };
      }
    }

    // First get the email's account ID
    const { data: email, error: emailError } = await context.supabase
      .from('email_index')
      .select('email_account_id')
      .eq('message_id', messageId)
      .single();

    if (emailError || !email) {
      return { valid: false, error: 'Email not found' };
    }

    // Then validate the user owns that account
    const accountValidation = await validateEmailAccountAccess(email.email_account_id, context);
    
    if (!accountValidation.valid) {
      return { valid: false, error: 'Access denied to email account' };
    }

    return { valid: true, emailAccountId: email.email_account_id };
  } catch (error) {
    console.error('Error validating email access:', error);
    return { valid: false, error: 'Internal error validating email access' };
  }
}

/**
 * Security audit log for email access attempts
 */
export function logEmailAccessAttempt(
  userId: string,
  action: string,
  resource: string,
  success: boolean,
  details?: any
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    success,
    details: details ? JSON.stringify(details) : undefined
  };
  
  console.log(`[EMAIL_SECURITY] ${JSON.stringify(logEntry)}`);
  
  // In production, you might want to store these in a security audit table
}


