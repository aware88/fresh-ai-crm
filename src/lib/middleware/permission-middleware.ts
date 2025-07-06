import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

type PermissionCheck = {
  resourceType: string;
  action: string;
};

/**
 * Middleware to check if a user has the required permissions
 * @param req The Next.js request object
 * @param permissionChecks The permissions to check
 * @param requireAll If true, the user must have all specified permissions. If false, the user must have any of the specified permissions.
 * @returns NextResponse or null if the user has the required permissions
 */
export async function checkPermission(
  req: NextRequest,
  permissionChecks: PermissionCheck | PermissionCheck[],
  requireAll: boolean = true
): Promise<NextResponse | null> {
  // Get the session
  const session = await getServerSession();
  
  // If not authenticated, return 401
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // System admins have all permissions
  if (session.user.is_admin) {
    return null; // Allow access
  }
  
  // Initialize Supabase client
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Normalize permission checks to array
  const checks = Array.isArray(permissionChecks) ? permissionChecks : [permissionChecks];
  
  // Check each permission
  const results = await Promise.all(
    checks.map(async ({ resourceType, action }) => {
      const { data, error } = await supabase.rpc('has_permission', {
        p_user_id: session.user.id,
        p_resource_type: resourceType,
        p_action: action,
      });
      
      if (error) {
        console.error('Permission check error:', error);
        return false;
      }
      
      return !!data;
    })
  );
  
  // Determine if the user has the required permissions
  const hasPermission = requireAll
    ? results.every(Boolean)
    : results.some(Boolean);
  
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You do not have permission to access this resource' },
      { status: 403 }
    );
  }
  
  return null; // Allow access
}

/**
 * Higher-order function to create a route handler with permission checks
 * @param handler The route handler function
 * @param permissionChecks The permissions to check
 * @param requireAll If true, the user must have all specified permissions. If false, the user must have any of the specified permissions.
 * @returns A new route handler function with permission checks
 */
export function withPermission(
  handler: (req: NextRequest) => Promise<NextResponse>,
  permissionChecks: PermissionCheck | PermissionCheck[],
  requireAll: boolean = true
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const permissionResponse = await checkPermission(req, permissionChecks, requireAll);
    
    if (permissionResponse) {
      return permissionResponse;
    }
    
    return handler(req);
  };
}
