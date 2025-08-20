import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
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
    
    // Use service role key for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get user's current organization from preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();
    
    if (prefsError || !preferences?.current_organization_id) {
      return NextResponse.json({ 
        error: 'User not associated with an organization' 
      }, { status: 400 });
    }
    
    const organizationId = preferences.current_organization_id;

    const body = await request.json();
    const { email, role = 'member' } = body;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if the email is already invited to the organization
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingUser = authUsers.users?.find(u => u.email === email);
    
    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 }
        );
      }
    }

    // Check subscription limits before adding user
    const enhancedSubscriptionService = new EnhancedSubscriptionService();
    
    // Get current user count for the organization
    const { count: currentUserCount, error: countError } = await supabase
      .from('organization_members')
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

    // Invite the user via Supabase Auth (this creates the user and sends invitation email)
    const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://app.helloaris.com/auth/invitation-accept'
    });
    
    if (inviteError) {
      console.error('Error inviting user:', inviteError);
      return NextResponse.json({ 
        error: 'Failed to send invitation' 
      }, { status: 500 });
    }
    
    const invitedUserId = newUser.user.id;

    // Add user to organization
    const { error: addError } = await supabase
      .from('organization_members')
      .insert({
        user_id: invitedUserId,
        organization_id: organizationId,
        role,
        status: 'invited',
        invited_by: userId
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