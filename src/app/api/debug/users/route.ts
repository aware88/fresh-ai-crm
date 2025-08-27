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

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    // Get all organization members
    const { data: orgMembers, error: orgMembersError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations:organization_id(*)
      `);

    // Get all user preferences
    const { data: userPrefs, error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('*');

    // Get all email accounts
    const { data: emailAccounts, error: emailAccountsError } = await supabase
      .from('email_accounts')
      .select('*');

    // Create a map of users with their associated data
    const users = authUsers?.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      const memberships = orgMembers?.filter(m => m.user_id === user.id) || [];
      const preferences = userPrefs?.find(p => p.user_id === user.id);
      const emails = emailAccounts?.filter(e => e.user_id === user.id) || [];
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profile,
        memberships,
        preferences,
        emails
      };
    });

    // Look for peter@alpinegroup.si specifically
    const peterUser = users?.find(u => u.email === 'peter@alpinegroup.si');

    return NextResponse.json({
      totalUsers: users?.length || 0,
      users,
      peterUser,
      debug: {
        authError: authError?.message,
        profilesError: profilesError?.message,
        orgMembersError: orgMembersError?.message,
        userPrefsError: userPrefsError?.message,
        emailAccountsError: emailAccountsError?.message
      }
    });

  } catch (error) {
    console.error('Debug users API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
