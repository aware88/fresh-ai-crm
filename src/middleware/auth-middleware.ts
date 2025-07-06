import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RoleService } from '@/services/role-service';

/**
 * Middleware to check if a user is authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      success: false,
      redirect: '/api/auth/signin'
    };
  }
  
  return {
    success: true,
    userId: (session.user as any).id,
    user: session.user
  };
}

/**
 * Middleware to check if a user is a system admin
 */
export async function requireSystemAdmin() {
  const auth = await requireAuth();
  
  if (!auth.success) {
    return auth;
  }
  
  try {
    const isAdmin = await RoleService.isSystemAdmin(auth.userId);
    
    if (!isAdmin) {
      return {
        success: false,
        redirect: '/'
      };
    }
    
    return {
      ...auth,
      isAdmin
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return {
      success: false,
      redirect: '/'
    };
  }
}

/**
 * Middleware to check if a user has a specific permission
 */
export async function requirePermission(permissionName: string) {
  const auth = await requireAuth();
  
  if (!auth.success) {
    return auth;
  }
  
  try {
    // System admins have all permissions
    const isSystemAdmin = await RoleService.isSystemAdmin(auth.userId);
    
    if (isSystemAdmin) {
      return {
        ...auth,
        hasPermission: true
      };
    }
    
    const hasPermission = await RoleService.userHasPermission(auth.userId, permissionName);
    
    if (!hasPermission) {
      return {
        success: false,
        redirect: '/'
      };
    }
    
    return {
      ...auth,
      hasPermission
    };
  } catch (error) {
    console.error(`Error checking permission ${permissionName}:`, error);
    return {
      success: false,
      redirect: '/'
    };
  }
}

/**
 * Middleware to check if a user is an organization admin
 */
export async function requireOrganizationAdmin(organizationId: string) {
  const auth = await requireAuth();
  
  if (!auth.success) {
    return auth;
  }
  
  try {
    // System admins can manage all organizations
    const isSystemAdmin = await RoleService.isSystemAdmin(auth.userId);
    
    if (isSystemAdmin) {
      return {
        ...auth,
        isOrganizationAdmin: true
      };
    }
    
    const isOrganizationAdmin = await RoleService.isOrganizationAdmin(auth.userId, organizationId);
    
    if (!isOrganizationAdmin) {
      return {
        success: false,
        redirect: '/'
      };
    }
    
    return {
      ...auth,
      isOrganizationAdmin
    };
  } catch (error) {
    console.error(`Error checking organization admin status for ${organizationId}:`, error);
    return {
      success: false,
      redirect: '/'
    };
  }
}
