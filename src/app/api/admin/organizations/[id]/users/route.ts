import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/middleware';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';

// GET /api/admin/organizations/[id]/users - Get users for an organization
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to view organization users
    const auth = await requirePermission('admin.organizations.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    const supabase = createServerClient();

    // Get organization to verify it exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get users for the organization with their roles
    const { data: userOrgs, error: userOrgError } = await supabase
      .from('user_organizations')
      .select(`
        user_id,
        created_at,
        users:user_id(id, email, created_at, last_sign_in_at),
        user_roles(role_id, roles:role_id(name, type))
      `)
      .eq('organization_id', organizationId);

    if (userOrgError) {
      console.error('Error fetching organization users:', userOrgError);
      return NextResponse.json({ error: 'Failed to fetch organization users' }, { status: 500 });
    }

    // Format the user data
    const users = userOrgs.map(userOrg => {
      const user = userOrg.users;
      const roles = userOrg.user_roles?.map(ur => ur.roles?.name).filter(Boolean) || [];
      
      return {
        id: user.id,
        email: user.email,
        role: roles.length > 0 ? roles.join(', ') : 'User',
        last_login: user.last_sign_in_at,
        created_at: user.created_at
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in organization users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/organizations/[id]/users - Add a user to an organization
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to manage organization users
    const auth = await requirePermission('admin.organizations.users.manage');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    const body = await request.json();
    const { email, role_id } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check subscription limits before adding user
    const enhancedSubscriptionService = new EnhancedSubscriptionService();
    
    // Get current user count for the organization
    const { count: currentUserCount, error: countError } = await supabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    
    if (countError) {
      console.error('Error counting users:', countError);
      return NextResponse.json({ 
        error: 'Failed to check user limits' 
      }, { status: 500 });
    }

    // Check if organization can add more users
    const { canAdd, reason } = await enhancedSubscriptionService.canAddMoreUsers(
      organizationId,
      currentUserCount || 0
    );

    if (!canAdd) {
      return NextResponse.json({ 
        error: reason || 'User limit reached',
        limitReached: true,
        currentCount: currentUserCount || 0
      }, { status: 403 });
    }

    // Check if user exists or create a new one
    let userId;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create a new user and send invitation
      const { data: newUser, error: createError } = await supabase.auth.admin.inviteUserByEmail(email);
      
      if (createError) {
        console.error('Error inviting user:', createError);
        return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
      }
      
      userId = newUser.user.id;
    }

    // Check if user is already in the organization
    const { data: existingUserOrg } = await supabase
      .from('user_organizations')
      .select('user_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (existingUserOrg) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Add user to the organization
    const { error: addError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: organizationId
      });

    if (addError) {
      console.error('Error adding user to organization:', addError);
      return NextResponse.json(
        { error: 'Failed to add user to organization' },
        { status: 500 }
      );
    }

    // Assign role if provided
    if (role_id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id
        });

      if (roleError) {
        console.error('Error assigning role to user:', roleError);
        // Continue even if role assignment fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      user_id: userId,
      message: 'User added to organization successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in organization users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
