import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/organizations/[id]/members/check-admin
 * Check if the current user is an admin of the specified organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;
    const supabase = createServiceRoleClient();

    console.log('🔐 Admin check: User', session.user.id, 'checking admin status for org:', organizationId);

    // Check organization membership and role
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();

    console.log('🔐 Admin check: Membership data:', membership);
    console.log('🔐 Admin check: Membership error:', membershipError);

    if (membershipError) {
      console.error('Error checking organization membership:', membershipError);
      
      // If it's a "no rows" error, user is not a member
      if (membershipError.code === 'PGRST116') {
        console.log('🔐 Admin check: User is not a member of this organization');
        return NextResponse.json({ isAdmin: false, reason: 'not_member' });
      }
      
      return NextResponse.json({ isAdmin: false, reason: 'error', error: membershipError.message });
    }

    // User is admin if their role is 'admin' or 'owner'
    const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

    console.log('🔐 Admin check: Final result - isAdmin:', isAdmin, 'role:', membership?.role);

    return NextResponse.json({ 
      isAdmin,
      role: membership?.role,
      reason: isAdmin ? 'admin_role' : 'not_admin'
    });

  } catch (error) {
    console.error('Error in check-admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
