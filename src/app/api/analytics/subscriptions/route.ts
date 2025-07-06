import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization
    // In a real implementation, you would verify the user's access to this organization

    // Get subscription metrics
    const [subscriptionsResult, plansResult, invoicesResult] = await Promise.all([
      // Get subscriptions for the organization
      supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),
      
      // Get subscription plans
      supabase
        .from('subscription_plans')
        .select('*'),
      
      // Get invoices for the organization
      supabase
        .from('subscription_invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
    ]);

    // Calculate metrics
    const subscriptions = subscriptionsResult.data || [];
    const plans = plansResult.data || [];
    const invoices = invoicesResult.data || [];

    // Calculate revenue metrics
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const lastMonthRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.created_at);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return invoice.status === 'paid' && 
               invoiceDate.getMonth() === lastMonth.getMonth() && 
               invoiceDate.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    // Calculate subscription metrics
    const activeSubscriptions = subscriptions.filter(sub => 
      ['active', 'trialing'].includes(sub.status)
    ).length;

    const cancelledSubscriptions = subscriptions.filter(sub => 
      sub.status === 'active' && sub.cancel_at_period_end === true
    ).length;

    // Calculate plan distribution
    const planDistribution = plans.map(plan => {
      const count = subscriptions.filter(sub => 
        sub.subscription_plan_id === plan.id && 
        ['active', 'trialing'].includes(sub.status)
      ).length;
      
      return {
        name: plan.name,
        count,
        revenue: invoices
          .filter(invoice => {
            const sub = subscriptions.find(s => s.id === invoice.subscription_id);
            return sub && sub.subscription_plan_id === plan.id && invoice.status === 'paid';
          })
          .reduce((sum, invoice) => sum + invoice.amount, 0)
      };
    });

    // Calculate monthly revenue for the last 6 months
    const monthlyRevenue = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      const year = month.getFullYear();
      
      const revenue = invoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.created_at);
          return invoice.status === 'paid' && 
                 invoiceDate.getMonth() === month.getMonth() && 
                 invoiceDate.getFullYear() === month.getFullYear();
        })
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      
      monthlyRevenue.push({
        month: `${monthName} ${year}`,
        revenue
      });
    }

    // Return the subscription analytics data
    return NextResponse.json({
      overview: {
        totalRevenue,
        lastMonthRevenue,
        activeSubscriptions,
        cancelledSubscriptions,
        revenueGrowth: lastMonthRevenue > 0 ? 
          ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
      },
      planDistribution,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription analytics data' },
      { status: 500 }
    );
  }
}
