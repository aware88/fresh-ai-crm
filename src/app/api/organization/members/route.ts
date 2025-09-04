import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

// GET /api/organization/members - Get members of user's organization
export async function GET(request: NextRequest) {
  try {
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

    // Get all members of the organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('user_id, role, joined_at, status')
      .eq('organization_id', organizationId);

    if (memberError) {
      console.error('Error fetching organization members:', memberError);
      return NextResponse.json({ 
        error: 'Failed to fetch team members' 
      }, { status: 500 });
    }

    if (!memberData || memberData.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Get user profiles for additional info
    const userIds = memberData.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    // Get auth users for email and last sign in info
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUserMap = new Map(
      authUsers.users?.map(u => [u.id, u]) || []
    );

    // Combine all data
    const members = memberData.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      const authUser = authUserMap.get(member.user_id);
      
      return {
        id: member.user_id,
        email: authUser?.email || '',
        name: profile?.name || authUser?.user_metadata?.name || authUser?.user_metadata?.full_name,
        avatar_url: profile?.avatar_url || authUser?.user_metadata?.avatar_url,
        role: member.role || 'member',
        status: member.status === 'active' ? 'active' : 'invited',
        created_at: member.joined_at,
        last_sign_in_at: authUser?.last_sign_in_at
      };
    });

    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error in GET /api/organization/members:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}