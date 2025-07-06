import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Middleware to protect API routes with permission checks
 * 
 * @param handler - The API route handler
 * @param requiredPermission - The permission required to access this route
 * @returns A wrapped handler that checks permissions before executing
 */
export const withPermission = (
  handler: NextApiHandler,
  requiredPermission: string
): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient({ req, res });
    
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      });
    }

    // Check if user has the required permission
    const { data, error } = await supabase.rpc('has_permission', {
      p_user_id: session.user.id,
      p_permission_string: requiredPermission,
    });

    if (error || !data) {
      console.error('Permission check error:', error);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }

    // User has permission, proceed with the handler
    return handler(req, res);
  };
};

/**
 * Middleware to protect API routes with multiple permission checks
 * 
 * @param handler - The API route handler
 * @param options - Configuration options for permission checking
 * @returns A wrapped handler that checks permissions before executing
 */
export const withPermissions = (
  handler: NextApiHandler,
  options: {
    anyPermission?: string[];
    allPermissions?: string[];
  }
): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { anyPermission, allPermissions } = options;
    const supabase = createServerSupabaseClient({ req, res });
    
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource',
      });
    }

    // Get all user permissions
    const { data: userPermissions, error } = await supabase.rpc('get_user_permissions');

    if (error) {
      console.error('Error fetching user permissions:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check permissions',
      });
    }

    const permissionSet = new Set(
      userPermissions?.map((p: any) => p.resource_type) || []
    );

    // Check if user has any of the required permissions
    if (anyPermission && anyPermission.length > 0) {
      const hasAny = anyPermission.some(permission => permissionSet.has(permission));
      if (!hasAny) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        });
      }
    }

    // Check if user has all of the required permissions
    if (allPermissions && allPermissions.length > 0) {
      const hasAll = allPermissions.every(permission => permissionSet.has(permission));
      if (!hasAll) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have all required permissions to access this resource',
        });
      }
    }

    // User has permission, proceed with the handler
    return handler(req, res);
  };
};
