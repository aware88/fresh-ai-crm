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

    console.log('🔍 Debug: Checking all organizations for user:', session.user.id);

    // Get all organizations
    const { data: allOrganizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    console.log('🏢 Found organizations:', allOrganizations);

    // Get organization members for each organization
    const organizationsWithMembers = [];
    
    for (const org of allOrganizations || []) {
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles:user_id(id, name, email)
        `)
        .eq('organization_id', org.id);

      if (membersError) {
        console.error(`Error fetching members for org ${org.id}:`, membersError);
      }

      organizationsWithMembers.push({
        ...org,
        members: members || [],
        membersError: membersError?.message
      });
    }

    // Get all organization members
    const { data: allMembers, error: allMembersError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations:organization_id(*),
        profiles:user_id(*)
      `)
      .order('created_at', { ascending: false });

    // Get current user's organization memberships
    const { data: userMemberships, error: userMembershipsError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations:organization_id(*)
      `)
      .eq('user_id', session.user.id);

    console.log('👤 Current user memberships:', userMemberships);

    // Get current user's preferences
    const { data: userPrefs, error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    console.log('📋 Current user preferences:', userPrefs);

    return NextResponse.json({
      currentUserId: session.user.id,
      currentUserEmail: session.user.email,
      totalOrganizations: allOrganizations?.length || 0,
      organizations: organizationsWithMembers,
      allMembers: allMembers || [],
      currentUserMemberships: userMemberships || [],
      currentUserPreferences: userPrefs,
      debug: {
        orgsError: orgsError?.message,
        allMembersError: allMembersError?.message,
        userMembershipsError: userMembershipsError?.message,
        userPrefsError: userPrefsError?.message
      }
    });

  } catch (error) {
    console.error('Debug organizations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
