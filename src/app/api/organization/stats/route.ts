import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

// GET /api/organization/stats - Get organization statistics
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

    // Get total member count
    const { count: totalMembers, error: totalError } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (totalError) {
      console.error('Error counting total members:', totalError);
      return NextResponse.json({ 
        error: 'Failed to get organization stats' 
      }, { status: 500 });
    }

    // Get member details for status counting
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId);

    if (memberError) {
      console.error('Error fetching member details:', memberError);
      return NextResponse.json({ 
        error: 'Failed to get organization stats' 
      }, { status: 500 });
    }

    // Get auth users for confirmation status
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUserMap = new Map(
      authUsers.users?.map(u => [u.id, u]) || []
    );

    let activeMembers = 0;
    let invitedMembers = 0;

    memberData?.forEach(member => {
      const authUser = authUserMap.get(member.user_id);
      if (authUser?.email_confirmed_at) {
        activeMembers++;
      } else {
        invitedMembers++;
      }
    });

    // Get organization details
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, settings')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization data:', orgError);
      return NextResponse.json({ 
        error: 'Failed to get organization stats' 
      }, { status: 500 });
    }

    // Define subscription limits based on plan
    const subscriptionLimits: Record<string, number> = {
      'free': 3,
      'starter': 1,
      'pro': 5,
      'premium_basic': 20,
      'premium_advanced': 50,
      'premium_enterprise': 100,
      'business': 200,
      'enterprise': 1000
    };

    // Fetch real subscription plan directly from user metadata (avoiding internal API calls)
    let plan = 'pro';
    try {
      console.log('🔍 Organization Stats: Fetching subscription plan directly...');
      console.log(`   Organization ID: ${organizationId}`);
      console.log(`   User ID: ${userId}`);
      
      // Get user data directly from Supabase auth to check their subscription plan
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.log('   Error fetching user data:', userError);
      } else {
        const userSubscriptionPlan = userData.user.user_metadata?.subscription_plan || 'starter';
        console.log(`   User subscription plan from metadata: ${userSubscriptionPlan}`);
        
        if (userSubscriptionPlan) {
          plan = userSubscriptionPlan.toLowerCase().replace(/\s+/g, '_');
          console.log(`   Normalized plan: "${plan}"`);
        }
      }
    } catch (error) {
      console.error('   Error fetching subscription:', error);
    }
    const subscriptionLimit = subscriptionLimits[plan] || 3;

    const stats = {
      totalMembers: totalMembers || 0,
      activeMembers,
      invitedMembers,
      subscriptionLimit,
      plan,
      subscriptionStatus: 'active'
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in GET /api/organization/stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}