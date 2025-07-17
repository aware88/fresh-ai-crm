import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/middleware';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';

// POST /api/admin/users/invite - Invite a new user
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to invite users
    const auth = await requirePermission('admin.users.invite');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      first_name, 
      last_name, 
      organization_id, 
      role_id,
      send_welcome_email 
    } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // If organization_id is provided, check subscription limits
    if (organization_id) {
      // Verify organization exists
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organization_id)
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
        .eq('organization_id', organization_id);
      
      if (countError) {
        console.error('Error counting users:', countError);
        return NextResponse.json({ 
          error: 'Failed to check user limits' 
        }, { status: 500 });
      }

      // Check if organization can add more users
      const { canAdd, reason } = await enhancedSubscriptionService.canAddMoreUsers(
        organization_id,
        currentUserCount || 0
      );

      if (!canAdd) {
        return NextResponse.json({ 
          error: reason || 'User limit reached',
          limitReached: true,
          currentCount: currentUserCount || 0
        }, { status: 403 });
      }
    }

    // Create user metadata
    const userMetadata: Record<string, any> = {};
    if (first_name) userMetadata.first_name = first_name;
    if (last_name) userMetadata.last_name = last_name;

    // Invite the user
    const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: Object.keys(userMetadata).length > 0 ? userMetadata : undefined
    });

    if (inviteError) {
      console.error('Error inviting user:', inviteError);
      return NextResponse.json(
        { error: 'Failed to invite user' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // If organization_id is provided, add user to the organization
    if (organization_id) {
      // Add user to organization
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id
        });

      if (userOrgError) {
        console.error('Error adding user to organization:', userOrgError);
        return NextResponse.json(
          { error: 'Failed to add user to organization' },
          { status: 500 }
        );
      }
    }

    // If role_id is provided, assign role to user
    if (role_id) {
      // Verify role exists
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', role_id)
        .single();

      if (roleError || !role) {
        console.error('Role not found:', roleError);
        // Continue even if role not found
      } else {
        // Assign role to user
        const { error: userRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id
          });

        if (userRoleError) {
          console.error('Error assigning role to user:', userRoleError);
          // Continue even if role assignment fails
        }
      }
    }

    // Send welcome email if requested
    if (send_welcome_email) {
      // In a real implementation, you might want to use a dedicated email service
      // For now, we'll just log that we would send an email
      console.log(`Welcome email would be sent to ${email}`);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'User invited successfully',
        user_id: userId 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in user invite API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
