import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Validates that the current user has access to an email account
 */
export async function validateEmailAccountAccess(emailAccountId: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { valid: false, error: 'Unauthorized - no session' };
    }

    const supabase = createServiceRoleClient();

    // Check if the user owns this email account
    const { data, error } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('id', emailAccountId)
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Access denied - email account not found or not owned by user' };
    }

    return { valid: true, userId: session.user.id };
  } catch (error) {
    console.error('Error validating email account access:', error);
    return { valid: false, error: 'Internal error validating access' };
  }
}

/**
 * Validates that the current user has a valid session
 */
export async function validateUserSession(): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { valid: false, error: 'Unauthorized - no session' };
    }

    return { valid: true, userId: session.user.id };
  } catch (error) {
    console.error('Error validating session:', error);
    return { valid: false, error: 'Internal error validating session' };
  }
}

/**
 * Gets the current user's email accounts
 */
export async function getUserEmailAccounts(): Promise<{ accounts?: string[]; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized - no session' };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', session.user.id);

    if (error) {
      return { error: error.message };
    }

    return { accounts: data?.map(a => a.id) || [] };
  } catch (error) {
    console.error('Error getting user email accounts:', error);
    return { error: 'Internal error getting email accounts' };
  }
}
