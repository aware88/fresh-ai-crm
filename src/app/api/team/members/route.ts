import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
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
        joined_at,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url,
          last_seen_at,
          is_online
        )
      `)
      .eq('organization_id', userOrg.organization_id);

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Transform the data to match our frontend interface
    const formattedMembers = teamMembers
      .filter(member => member.profiles) // Only include members with profiles
      .map(member => {
        const profile = member.profiles as any;
        const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at) : new Date(member.joined_at);
        const isRecentlyActive = profile.is_online || (Date.now() - lastSeen.getTime() < 5 * 60 * 1000); // 5 minutes
        
        let status: 'online' | 'away' | 'busy' | 'offline' = 'offline';
        if (profile.is_online) {
          status = 'online';
        } else if (Date.now() - lastSeen.getTime() < 30 * 60 * 1000) { // 30 minutes
          status = 'away';
        } else if (Date.now() - lastSeen.getTime() < 2 * 60 * 60 * 1000) { // 2 hours
          status = 'busy';
        }

        return {
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
          email: profile.email,
          avatar: profile.avatar_url,
          role: member.role,
          status,
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
