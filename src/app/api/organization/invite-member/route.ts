import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';

/**
 * POST /api/organization/invite-member
 * Invite a team member to the organization with subscription limit enforcement
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const organizationId = (session.user as any).organizationId;

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'User not associated with an organization' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { email, role = 'member' } = body;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if user already exists in the organization
    const { data: existingMember } = await supabase
      .from('user_organizations')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
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

    // Check if user already exists in the system
    let invitedUserId;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      invitedUserId = existingUser.id;
    } else {
      // Invite the user via Supabase Auth
      const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
      
      if (inviteError) {
        console.error('Error inviting user:', inviteError);
        return NextResponse.json({ 
          error: 'Failed to send invitation' 
        }, { status: 500 });
      }
      
      invitedUserId = newUser.user.id;
    }

    // Add user to organization
    const { error: addError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: invitedUserId,
        organization_id: organizationId,
        role,
        invited_by: userId,
        invited_at: new Date().toISOString()
      });

    if (addError) {
      console.error('Error adding user to organization:', addError);
      return NextResponse.json(
        { error: 'Failed to add user to organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Team member invited successfully',
      invitedUserId,
      email
    }, { status: 201 });

  } catch (error) {
    console.error('Error in invite member API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 