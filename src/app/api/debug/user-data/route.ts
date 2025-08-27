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

    const userId = session.user.id;
    const supabase = createServiceRoleClient();

    console.log('🔍 Debug: Checking user data for:', userId);

    // Get user preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('📋 User preferences:', preferences);
    console.log('❌ Preferences error:', prefsError);

    // Get organization memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations:organization_id(*)
      `)
      .eq('user_id', userId);

    console.log('🏢 Organization memberships:', memberships);
    console.log('❌ Memberships error:', membershipsError);

    // Get all organizations this user might be associated with
    let allOrganizations = [];
    if (preferences?.current_organization_id) {
      const { data: currentOrg, error: currentOrgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', preferences.current_organization_id)
        .single();
      
      if (currentOrg) {
        allOrganizations.push({
          source: 'user_preferences.current_organization_id',
          organization: currentOrg
        });
      }
      console.log('🏢 Current organization from preferences:', currentOrg);
      console.log('❌ Current org error:', currentOrgError);
    }

    // Get organizations from memberships
    if (memberships && memberships.length > 0) {
      memberships.forEach(membership => {
        if (membership.organizations) {
          allOrganizations.push({
            source: 'organization_members',
            membership: membership,
            organization: membership.organizations
          });
        }
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('👤 User profile:', profile);
    console.log('❌ Profile error:', profileError);

    return NextResponse.json({
      userId,
      userEmail: session.user.email,
      preferences,
      memberships,
      allOrganizations,
      profile,
      debug: {
        preferencesError: prefsError?.message,
        membershipsError: membershipsError?.message,
        profileError: profileError?.message
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

