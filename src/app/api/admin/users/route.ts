import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/middleware';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view users
    const auth = await requirePermission('admin.users.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServerClient();

    // Get all users with their organization and role information
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users from auth:', authError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get user organizations
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select(`
        user_id,
        organizations:organization_id(id, name)
      `);

    if (userOrgsError) {
      console.error('Error fetching user organizations:', userOrgsError);
      return NextResponse.json({ error: 'Failed to fetch user organizations' }, { status: 500 });
    }

    // Get user roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles:role_id(name)
      `);

    if (userRolesError) {
      console.error('Error fetching user roles:', userRolesError);
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
    }

    // Create a map of user_id to organization name
    const userOrgMap: Record<string, string> = {};
    userOrgs.forEach(userOrg => {
      if (userOrg.organizations) {
        userOrgMap[userOrg.user_id] = userOrg.organizations.name;
      }
    });

    // Create a map of user_id to role
    const userRoleMap: Record<string, string[]> = {};
    userRoles.forEach(userRole => {
      if (userRole.roles && userRole.roles.name) {
        if (!userRoleMap[userRole.user_id]) {
          userRoleMap[userRole.user_id] = [];
        }
        userRoleMap[userRole.user_id].push(userRole.roles.name);
      }
    });

    // Format the user data
    const users = authUsers.users.map(user => {
      // Determine user status
      let status = 'Active';
      if (!user.email_confirmed_at) {
        status = 'Invited';
      } else if (user.banned_until) {
        status = 'Suspended';
      } else if (!user.last_sign_in_at) {
        status = 'Inactive';
      }

      return {
        id: user.id,
        email: user.email,
        role: userRoleMap[user.id] ? userRoleMap[user.id].join(', ') : 'User',
        organization_name: userOrgMap[user.id] || '',
        last_login: user.last_sign_in_at,
        status,
        created_at: user.created_at
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
