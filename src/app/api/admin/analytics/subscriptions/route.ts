import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { createClient } from '@/lib/supabase/server';
import { subscriptionPlans } from '@/lib/subscription-plans-v2';

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  return true;
}

// GET /api/admin/analytics/subscriptions - Get subscription analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    
    // Check if user is admin
    const admin = await isAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get date range from query params
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '30d';
    
    // Calculate start date based on range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    const supabase = await createClient();
    
    // Get subscription counts by status
    const { data: subscriptionCounts, error: countError } = await supabase
      .from('organization_subscriptions')
      .select('status')
      .gte('created_at', startDate.toISOString());
    
    if (countError) {
      console.error('Error fetching subscription counts:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription analytics' },
        { status: 500 }
      );
    }
    
    // Get subscription counts by plan
    const { data: planCounts, error: planError } = await supabase
      .from('organization_subscriptions')
      .select('subscription_plan_id, subscription_plans(name)')
      .gte('created_at', startDate.toISOString());
    
    if (planError) {
      console.error('Error fetching plan counts:', planError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription analytics' },
        { status: 500 }
      );
    }
    
    // Get subscriptions by month
    const { data: subscriptionsByDate, error: dateError } = await supabase
      .from('organization_subscriptions')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (dateError) {
      console.error('Error fetching subscriptions by date:', dateError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription analytics' },
        { status: 500 }
      );
    }
    
    // Get MRR data
    const { data: mrrData, error: mrrError } = await supabase
      .from('organization_subscriptions')
      .select('subscription_plans(price, billing_interval)')
      .in('status', ['active', 'trialing'])
      .gte('created_at', startDate.toISOString());
    
    if (mrrError) {
      console.error('Error fetching MRR data:', mrrError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription analytics' },
        { status: 500 }
      );
    }
    
    // Process subscription counts by status
    const totalSubscriptions = subscriptionCounts.length;
    const activeSubscriptions = subscriptionCounts.filter((s: any) => s.status === 'active').length;
    const trialingSubscriptions = subscriptionCounts.filter((s: any) => s.status === 'trialing').length;
    const canceledSubscriptions = subscriptionCounts.filter((s: any) => s.status === 'canceled').length;
    
    // Process plan distribution
    const planDistribution: Record<string, number> = {};
    planCounts.forEach((item: any) => {
      const planName = item.subscription_plans?.name || 'Unknown';
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    });
    
    // Add Free plan if not present
    if (!planDistribution['Free']) {
      planDistribution['Free'] = 0;
    }
    
    // Process subscriptions by month
    const subscriptionsByMonth: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    subscriptionsByDate.forEach((item: any) => {
      const date = new Date(item.created_at);
      const monthKey = months[date.getMonth()];
      subscriptionsByMonth[monthKey] = (subscriptionsByMonth[monthKey] || 0) + 1;
    });
    
    // Calculate MRR
    let mrr = 0;
    mrrData.forEach((item: any) => {
      if (item.subscription_plans) {
        const price = item.subscription_plans.price || 0;
        const interval = item.subscription_plans.billing_interval;
        
        // Convert yearly to monthly
        if (interval === 'yearly') {
          mrr += price / 12;
        } else {
          mrr += price;
        }
      }
    });
    
    // Get user counts for organizations with active subscriptions
    const { data: userCounts, error: userError } = await supabase
      .from('organization_users')
      .select('organization_id, count');
    
    if (userError) {
      console.error('Error fetching user counts:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user analytics' },
        { status: 500 }
      );
    }
    
    // Calculate cohort retention
    // Group subscriptions by month cohort
    const cohorts: Record<string, { total: number; active: number; canceled: number }> = {};
    
    const { data: cohortData, error: cohortError } = await supabase
      .from('organization_subscriptions')
      .select('created_at, status, updated_at')
      .gte('created_at', new Date(startDate.setMonth(startDate.getMonth() - 6)).toISOString());
    
    if (cohortError) {
      console.error('Error fetching cohort data:', cohortError);
      return NextResponse.json(
        { error: 'Failed to fetch cohort analytics' },
        { status: 500 }
      );
    }
    
    cohortData.forEach((subscription: any) => {
      const date = new Date(subscription.created_at);
      const cohortKey = `${months[date.getMonth()]}-${date.getFullYear()}`;
      
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = { total: 0, active: 0, canceled: 0 };
      }
      
      cohorts[cohortKey].total += 1;
      
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        cohorts[cohortKey].active += 1;
      } else if (subscription.status === 'canceled') {
        cohorts[cohortKey].canceled += 1;
      }
    });
    
    // Calculate retention rates for each cohort
    const cohortRetention = Object.entries(cohorts).map(([cohort, data]) => ({
      cohort,
      retentionRate: data.total > 0 ? Math.round((data.active / data.total) * 100) : 0,
      cancelRate: data.total > 0 ? Math.round((data.canceled / data.total) * 100) : 0,
      total: data.total,
      active: data.active,
      canceled: data.canceled
    }));
    
    // Calculate conversion rates from trial to paid
    const { data: conversionData, error: conversionError } = await supabase
      .from('organization_subscriptions')
      .select('id, status, created_at, updated_at')
      .eq('status', 'active')
      .gte('created_at', startDate.toISOString());
    
    if (conversionError) {
      console.error('Error fetching conversion data:', conversionError);
      return NextResponse.json(
        { error: 'Failed to fetch conversion analytics' },
        { status: 500 }
      );
    }
    
    // Count how many subscriptions converted from trial to paid
    const trialToPaidCount = conversionData.length;
    const conversionRate = trialingSubscriptions > 0 
      ? Math.round((trialToPaidCount / (trialToPaidCount + trialingSubscriptions)) * 100) 
      : 0;
    
    // Calculate ARPU (Average Revenue Per User)
    const totalUsers = userCounts.reduce((sum: number, org: any) => sum + (org.count || 1), 0);
    const arpu = totalUsers > 0 ? Math.round(mrr / totalUsers) : 0;
    
    // Calculate average subscription value
    const averageSubscriptionValue = activeSubscriptions > 0 
      ? Math.round(mrr / activeSubscriptions) 
      : 0;
    
    // Calculate overall retention rate
    const retentionRate = totalSubscriptions > 0 
      ? Math.round((activeSubscriptions / totalSubscriptions) * 100) 
      : 0;
    
    // Calculate churn rate
    const churnRate = totalSubscriptions > 0 
      ? Math.round((canceledSubscriptions / totalSubscriptions) * 100) 
      : 0;
    
    // Get plan distribution by revenue
    const planRevenueDistribution: Record<string, number> = {};
    mrrData.forEach((item: any) => {
      if (item.subscription_plans) {
        const planName = item.subscription_plans.name || 'Unknown';
        const price = item.subscription_plans.price || 0;
        const interval = item.subscription_plans.billing_interval;
        
        // Convert yearly to monthly
        const monthlyPrice = interval === 'yearly' ? price / 12 : price;
        
        planRevenueDistribution[planName] = (planRevenueDistribution[planName] || 0) + monthlyPrice;
      }
    });
    
    // Calculate lifetime value estimate (simplified)
    const averageLifetimeMonths = 12; // Assumption: average customer stays for 1 year
    const estimatedLTV = averageSubscriptionValue * averageLifetimeMonths;
    
    const metrics = {
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      canceledSubscriptions,
      mrr: Math.round(mrr),
      planDistribution,
      planRevenueDistribution,
      subscriptionsByMonth,
      retentionRate,
      churnRate,
      conversionRate,
      arpu,
      averageSubscriptionValue,
      estimatedLTV,
      cohortRetention
    };
    
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription analytics' },
      { status: 500 }
    );
  }
}
