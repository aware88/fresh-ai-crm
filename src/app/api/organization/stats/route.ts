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
      'premium': -1, // Unlimited for Premium
      'premium_basic': 20,
      'premium_advanced': 50,
      'premium_enterprise': 100,
      'business': 200,
      'enterprise': 1000
    };

    // Fetch organization's subscription plan from the organizations table
    let plan = 'pro';
    try {
      console.log('🔍 Organization Stats: Fetching organization subscription plan...');
      console.log(`   Organization ID: ${organizationId}`);
      console.log(`   User ID: ${userId}`);
      
      // Get organization subscription plan from the organizations table
      const { data: orgSubscription, error: subscriptionError } = await supabase
        .from('organizations')
        .select('subscription_tier, beta_early_adopter, subscription_metadata')
        .eq('id', organizationId)
        .single();
      
      if (subscriptionError || !orgSubscription) {
        console.log('   Error fetching organization subscription:', subscriptionError);
        console.log('   Falling back to starter plan');
        plan = 'starter';
      } else {
        const organizationPlan = orgSubscription.subscription_tier || 'starter';
        console.log(`   Organization subscription tier: ${organizationPlan}`);
        console.log(`   Beta early adopter: ${orgSubscription.beta_early_adopter}`);
        
        plan = organizationPlan.toLowerCase().replace(/\s+/g, '_');
        console.log(`   Normalized plan: "${plan}"`);
      }
    } catch (error) {
      console.error('   Error fetching organization subscription:', error);
      plan = 'starter';
    }
    const subscriptionLimit = subscriptionLimits[plan] || 3;
    
    console.log('🔍 Subscription limit calculation:', { 
      plan, 
      subscriptionLimit: subscriptionLimit === -1 ? 'Unlimited' : subscriptionLimit 
    });

    const stats = {
      totalMembers: totalMembers || 0,
      activeMembers,
      invitedMembers,
      subscriptionLimit,
      plan,
      subscriptionStatus: 'active'
    };

    console.log('🎯 Organization Stats Final Result:', {
      organizationId,
      userId,
      plan,
      subscriptionLimit,
      totalMembers: stats.totalMembers
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in GET /api/organization/stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}