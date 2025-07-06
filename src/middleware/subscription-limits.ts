import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAddMoreContacts, canAddMoreUsers } from '@/lib/subscription-feature-check';
import { createClient } from '@/lib/supabase/server';

/**
 * Middleware to check subscription limits before creating new contacts
 */
export async function checkContactLimit(
  req: NextRequest,
  organizationId: string
): Promise<NextResponse | null> {
  try {
    // Get the current contact count for the organization
    const supabase = createClient();
    const { count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    if (error) {
      console.error('Error counting contacts:', error);
      return NextResponse.json(
        { error: 'Failed to check contact limits' },
        { status: 500 }
      );
    }
    
    const currentContactCount = count || 0;
    
    // Check if the organization can add more contacts
    const { canAdd, reason } = await canAddMoreContacts(organizationId, currentContactCount);
    
    if (!canAdd) {
      return NextResponse.json(
        { error: reason || 'Contact limit reached' },
        { status: 403 }
      );
    }
    
    // If the check passes, return null to continue with the request
    return null;
  } catch (error) {
    console.error('Error checking contact limit:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check subscription limits before creating new users
 */
export async function checkUserLimit(
  req: NextRequest,
  organizationId: string
): Promise<NextResponse | null> {
  try {
    // Get the current user count for the organization
    const supabase = createClient();
    const { count, error } = await supabase
      .from('organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    if (error) {
      console.error('Error counting users:', error);
      return NextResponse.json(
        { error: 'Failed to check user limits' },
        { status: 500 }
      );
    }
    
    const currentUserCount = count || 0;
    
    // Check if the organization can add more users
    const { canAdd, reason } = await canAddMoreUsers(organizationId, currentUserCount);
    
    if (!canAdd) {
      return NextResponse.json(
        { error: reason || 'User limit reached' },
        { status: 403 }
      );
    }
    
    // If the check passes, return null to continue with the request
    return null;
  } catch (error) {
    console.error('Error checking user limit:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    );
  }
}

/**
 * Example of how to use these middleware functions in an API route:
 * 
 * ```typescript
 * // In your API route handler
 * export async function POST(request: NextRequest) {
 *   const organizationId = '...'; // Get from request
 *   
 *   // Check contact limit
 *   const limitCheck = await checkContactLimit(request, organizationId);
 *   if (limitCheck) return limitCheck; // Return error response if limit reached
 *   
 *   // Continue with contact creation
 *   // ...
 * }
 * ```
 */
