import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    // Check if user is authenticated via NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = userId; // Use user ID as organization ID for now

    // Get current date ranges with proper timezone handling
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);
    sixtyDaysAgo.setHours(0, 0, 0, 0);
    
    console.log('Analytics date ranges:', {
      current: currentDate.toISOString(),
      thirtyDaysAgo: thirtyDaysAgo.toISOString(),
      sixtyDaysAgo: sixtyDaysAgo.toISOString()
    });

    // Get counts for different entities
    const [
      suppliersResult,
      productsResult,
      documentsResult,
      supplierEmailsResult,
      pricingResult,
      // Sales/revenue data from sales_documents
      revenueCurrentResult,
      revenuePreviousResult,
      // Orders data from sales_documents 
      ordersCurrentResult,
      ordersPreviousResult,
      // Customer data from distinct contacts/suppliers
      customersCurrentResult,
      customersPreviousResult
    ] = await Promise.allSettled([
      // Count suppliers (organization shared data)
      supabase
        .from('suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any),
      
      // Count products (organization shared data)
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any),
      
      // Count documents (organization shared data)
      supabase
        .from('supplier_documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any),
      
      // Count supplier emails (organization shared data)
      supabase
        .from('supplier_emails')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any),
      
      // Get pricing stats (organization shared data)
      supabase
        .from('supplier_pricing')
        .select('price')
        .eq('organization_id', organizationId as any),

      // Current revenue (last 30 days) - organization shared data
      supabase
        .from('sales_documents')
        .select('total_amount')
        .eq('organization_id', organizationId as any)
        .eq('status', 'completed' as any)
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Previous revenue (30-60 days ago) - organization shared data
      supabase
        .from('sales_documents')
        .select('total_amount')
        .eq('organization_id', organizationId as any)
        .eq('status', 'completed' as any)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),

      // Current orders (last 30 days) - organization shared data
      supabase
        .from('sales_documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any)
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Previous orders (30-60 days ago) - organization shared data
      supabase
        .from('sales_documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),

      // Current customers (use suppliers as customers) - organization shared data
      supabase
        .from('suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any)
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Previous customers (30-60 days ago) - organization shared data
      supabase
        .from('suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId as any)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),
    ]);

    // Safely extract results with fallbacks
    const getCount = (result: PromiseSettledResult<any>) => {
      return result.status === 'fulfilled' && result.value.count !== null ? result.value.count : 0;
    };

    const getData = (result: PromiseSettledResult<any>) => {
      return result.status === 'fulfilled' && result.value.data ? result.value.data : [];
    };

    // Calculate price statistics
    let avgPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;
    
    const pricingData = getData(pricingResult);
    if (Array.isArray(pricingData) && pricingData.length > 0) {
      const prices = pricingData.map((item: any) => item.price || 0);
      avgPrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }

    // Calculate revenue metrics with proper error handling
    const currentRevenueData = getData(revenueCurrentResult);
    const previousRevenueData = getData(revenuePreviousResult);
    
    const currentRevenue = Array.isArray(currentRevenueData) 
      ? currentRevenueData.reduce((sum: number, doc: any) => sum + (parseFloat(doc.total_amount) || 0), 0) 
      : 0;
    const previousRevenue = Array.isArray(previousRevenueData) 
      ? previousRevenueData.reduce((sum: number, doc: any) => sum + (parseFloat(doc.total_amount) || 0), 0) 
      : 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 
                        (currentRevenue > 0 ? 100 : 0);
    
    console.log('Revenue calculation:', {
      currentRevenue,
      previousRevenue,
      revenueChange,
      currentCount: currentRevenueData?.length || 0,
      previousCount: previousRevenueData?.length || 0
    });

    // Calculate order metrics with proper edge case handling
    const currentOrders = getCount(ordersCurrentResult);
    const previousOrders = getCount(ordersPreviousResult);
    const orderChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 
                       (currentOrders > 0 ? 100 : 0);

    // Calculate customer metrics (using suppliers) with proper edge case handling
    const currentCustomers = getCount(customersCurrentResult);
    const previousCustomers = getCount(customersPreviousResult);
    const customerChange = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 
                          (currentCustomers > 0 ? 100 : 0);
    
    console.log('Orders/Customers calculation:', {
      currentOrders,
      previousOrders,
      orderChange,
      currentCustomers,
      previousCustomers,
      customerChange
    });

    // Calculate supplier metrics  
    const totalSuppliers = getCount(suppliersResult);
    const totalProducts = getCount(productsResult);
    const totalDocuments = getCount(documentsResult);
    const totalSupplierEmails = getCount(supplierEmailsResult);

    // For debugging - log what data we found
    console.log('Analytics Data:', {
      suppliers: totalSuppliers,
      products: totalProducts,
      documents: totalDocuments,
      supplierEmails: totalSupplierEmails,
      pricing: pricingData.length
    });

    // Return the complete analytics data structure
    return NextResponse.json({
      counts: {
        revenue: Math.round(currentRevenue),
        orders: currentOrders,
        customers: currentCustomers,
        suppliers: totalSuppliers,
        products: totalProducts,
        documents: totalDocuments,
      },
      pricing: {
        average: avgPrice,
        minimum: minPrice,
        maximum: maxPrice,
      },
      revenue: {
        total: currentRevenue,
        previousPeriod: previousRevenue,
        percentChange: Math.round(revenueChange * 100) / 100,
      },
      orders: {
        total: currentOrders,
        previousPeriod: previousOrders,
        percentChange: Math.round(orderChange * 100) / 100,
      },
      customers: {
        total: currentCustomers,
        previousPeriod: previousCustomers,
        percentChange: Math.round(customerChange * 100) / 100,
      },
      suppliers: {
        total: totalSuppliers,
        previousPeriod: totalSuppliers, // No historical comparison for now
        percentChange: 0,
      },
      // Debug info
      debug: {
        supplierEmailsCount: totalSupplierEmails,
        hasSupplierEmails: totalSupplierEmails > 0
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
