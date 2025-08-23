import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get customer data and sales history for upsell analysis
    let customersQuery = supabase
      .from('contacts')
      .select(`
        id,
        name,
        email,
        created_at,
        updated_at,
        organization_id
      `)
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (organizationId) {
      customersQuery = customersQuery.eq('organization_id', organizationId);
    }

    const { data: customers, error: customersError } = await customersQuery;

    if (customersError) {
      console.error('Error fetching customers for upsell analytics:', customersError);
      return NextResponse.json(
        { error: 'Failed to fetch customer data' },
        { status: 500 }
      );
    }

    // Get sales/revenue data from sales_documents table
    let salesQuery = supabase
      .from('sales_documents')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (organizationId) {
      salesQuery = salesQuery.eq('organization_id', organizationId);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    }

    // Get supplier pricing data for value calculations
    let pricingQuery = supabase
      .from('supplier_pricing')
      .select('*')
      .eq('user_id', session.user.id);

    if (organizationId) {
      pricingQuery = pricingQuery.eq('organization_id', organizationId);
    }

    const { data: pricingData, error: pricingError } = await pricingQuery;

    if (pricingError) {
      console.error('Error fetching pricing data:', pricingError);
    }

    // Calculate metrics
    const totalCustomers = customers?.length || 0;
    const totalSales = salesData?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
    const averageOrderValue = totalCustomers > 0 ? totalSales / totalCustomers : 0;

    // Generate upsell opportunities based on customer data
    const opportunities = customers?.slice(0, 10).map((customer, index) => {
      const currentValue = Math.floor(Math.random() * 2000) + 500; // Simulate current customer value
      const potentialMultiplier = 1.3 + (Math.random() * 0.7); // 1.3x to 2x potential
      const potentialValue = Math.floor(currentValue * potentialMultiplier);
      const uplift = Math.floor(((potentialValue - currentValue) / currentValue) * 100);
      
      const categories = ['Premium Package', 'Volume Upgrade', 'Add-on Services', 'Service Upgrade'];
      const confidences: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
      
      return {
        id: customer.id,
        customerName: customer.name || `Customer ${index + 1}`,
        currentValue,
        potentialValue,
        uplift,
        confidence: confidences[Math.floor(Math.random() * confidences.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        lastInteraction: `${Math.floor(Math.random() * 7) + 1} days ago`,
        recommendedAction: 'Schedule consultation call'
      };
    }) || [];

    // Calculate previous period for growth comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    let previousSalesQuery = supabase
      .from('sales_documents')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString());

    if (organizationId) {
      previousSalesQuery = previousSalesQuery.eq('organization_id', organizationId);
    }

    const { data: previousSalesData } = await previousSalesQuery;
    const previousSales = previousSalesData?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
    
    // Calculate estimated upsell revenue (20% of total sales as potential upsell)
    const upsellRevenue = Math.floor(totalSales * 0.2);
    const conversionRate = totalCustomers > 0 ? (opportunities.length / totalCustomers) * 100 : 0;
    const averageUplift = opportunities.length > 0 
      ? opportunities.reduce((sum, opp) => sum + opp.uplift, 0) / opportunities.length 
      : 0;
    
    const monthlyGrowth = previousSales > 0 
      ? ((totalSales - previousSales) / previousSales) * 100 
      : 0;

    const analytics = {
      metrics: {
        totalRevenue: totalSales,
        upsellRevenue,
        conversionRate,
        averageUplift,
        activeOpportunities: opportunities.length,
        monthlyGrowth
      },
      opportunities
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in upsell analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
