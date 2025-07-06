import { createServerClient } from '@/lib/supabase/server';

/**
 * Checks if the current user is an admin
 * @returns Promise<boolean> True if the user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user:', userError);
      return false;
    }
    
    // Get the user's role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();
    
    if (roleError) {
      console.error('Error getting user role:', roleError);
      return false;
    }
    
    // Check if the user has the admin role
    return userRole?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Checks if the current user is an organization admin
 * @param organizationId The ID of the organization to check admin status for
 * @returns Promise<boolean> True if the user is an organization admin, false otherwise
 */
export async function isOrganizationAdmin(organizationId: string): Promise<boolean> {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user:', userError);
      return false;
    }
    
    // Check if the user is an admin for the organization
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('organization_id', organizationId)
      .single();
    
    if (orgError) {
      console.error('Error checking organization admin status:', orgError);
      return false;
    }
    
    // Check if the user has the admin role for the organization
    return orgUser?.role === 'admin';
  } catch (error) {
    console.error('Error checking organization admin status:', error);
    return false;
  }
}
