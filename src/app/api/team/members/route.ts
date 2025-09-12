import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get current user's organization
    const { data: userOrg, error: userOrgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (userOrgError || !userOrg) {
      console.error('Error fetching user organization:', userOrgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all team members in the same organization
    const { data: teamMembers, error: teamError } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        joined_at
      `)
      .eq('organization_id', userOrg.organization_id);

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Transform the data to match our frontend interface
    const formattedMembers = (teamMembers || []).map((member: any) => {
        const lastSeen = new Date(member.joined_at);
        
        return {
          id: member.user_id,
          name: 'Team Member',
          email: 'member@example.com',
          avatar: null,
          role: member.role,
          status: 'offline' as const,
          lastSeen: lastSeen.toISOString(),
          joinedAt: member.joined_at
        };
      });

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error('Error in team members API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
