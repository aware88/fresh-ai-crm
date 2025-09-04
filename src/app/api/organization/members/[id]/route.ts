import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

// PATCH /api/organization/members/[id] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: memberId } = await params;
    
    // Use service role key for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
    const { role } = body;

    if (!role || !['member', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be member or admin.' 
      }, { status: 400 });
    }

    // Check if current user is admin/owner of the organization
    const { data: currentUserRole } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!currentUserRole || !['admin', 'owner'].includes(currentUserRole.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to update member roles' 
      }, { status: 403 });
    }

    // Check if target member exists in the organization
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ 
        error: 'Member not found in organization' 
      }, { status: 404 });
    }

    // Prevent changing owner role
    if (targetMember.role === 'owner') {
      return NextResponse.json({ 
        error: 'Cannot change owner role' 
      }, { status: 400 });
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('user_id', memberId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update member role' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Member role updated successfully' 
    });

  } catch (error) {
    console.error('Error in PATCH /api/organization/members/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/organization/members/[id] - Remove member from organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: memberId } = await params;
    
    // Use service role key for server-side operations to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    // Check if current user is admin/owner of the organization
    const { data: currentUserRole } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!currentUserRole || !['admin', 'owner'].includes(currentUserRole.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to remove members' 
      }, { status: 403 });
    }

    // Check if target member exists in the organization
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ 
        error: 'Member not found in organization' 
      }, { status: 404 });
    }

    // Prevent removing owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ 
        error: 'Cannot remove organization owner' 
      }, { status: 400 });
    }

    // Prevent self-removal
    if (memberId === userId) {
      return NextResponse.json({ 
        error: 'Cannot remove yourself from the organization' 
      }, { status: 400 });
    }

    // Remove the member from the organization
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', memberId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to remove member' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Member removed successfully' 
    });

  } catch (error) {
    console.error('Error in DELETE /api/organization/members/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}