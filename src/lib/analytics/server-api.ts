import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { AnalyticsData } from './types';
import { mockAnalyticsData, mockSupplierData, mockProductData, mockPriceData } from './mock-data';

// Helper to determine if we're in development mode
const isDev = () => process.env.NODE_ENV === 'development';

// Helper to log server-side debug info only in development
const debugLog = (message: string, data?: any) => {
  if (isDev()) {
    console.log(`[Server API Debug] ${message}`, data ? data : '');
  }
};

/**
 * Sample analytics data for development mode
 */
const developmentAnalyticsData = {
  counts: {
    revenue: 15420,
    orders: 23,
    customers: 8,
    suppliers: 5,
    products: 12,
    documents: 18
  },
  pricing: {
    average: 145.50,
    minimum: 25.00,
    maximum: 450.00
  },
  revenue: {
    total: 15420,
    previousPeriod: 12350,
    percentChange: 24.86
  },
  orders: {
    total: 23,
    previousPeriod: 18,
    percentChange: 27.78
  },
  customers: {
    total: 8,
    previousPeriod: 6,
    percentChange: 33.33
  },
  suppliers: {
    total: 5,
    previousPeriod: 4,
    percentChange: 25.00
  }
};

/**
 * Empty analytics data for when no real data exists
 */
const emptyAnalyticsData = {
  counts: {
    revenue: 0,
    orders: 0,
    customers: 0,
    suppliers: 0,
    products: 0,
    documents: 0
  },
  pricing: {
    average: 0,
    minimum: 0,
    maximum: 0
  },
  revenue: {
    total: 0,
    previousPeriod: 0,
    percentChange: 0
  },
  orders: {
    total: 0,
    previousPeriod: 0,
    percentChange: 0
  },
  customers: {
    total: 0,
    previousPeriod: 0,
    percentChange: 0
  },
  suppliers: {
    total: 0,
    previousPeriod: 0,
    percentChange: 0
  }
};

/**
 * Server-side function to fetch analytics data
 */
export async function fetchAnalyticsServer(): Promise<AnalyticsData & { organizationId: string }> {
  const session = await getServerSession(authOptions);
  
  // Debug session info
  debugLog('Session in fetchAnalyticsServer:', session ? 'exists' : 'missing');
  
  // Get organization ID from session or use dev ID in development
  const organizationId = session?.user?.id || (isDev() ? "dev-user-id" : "");
  debugLog('Organization ID:', organizationId);
  
  // Require authentication in all environments
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  if (!organizationId) {
    throw new Error('Unauthorized: No organization ID found');
  }
  
  try {
    // Instead of fetch, directly query the database
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId);
    
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', organizationId);
    
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Calculate analytics from real data
    const totalContacts = contacts?.length || 0;
    const totalSuppliers = suppliers?.length || 0;
    const totalProducts = products?.length || 0;
    
    // Calculate revenue (placeholder - you can enhance this)
    const totalRevenue = 0; // TODO: Calculate from orders
    
    // Calculate growth rates (placeholder)
    const contactGrowth = 0;
    const supplierGrowth = 0;
    const productGrowth = 0;
    const revenueGrowth = 0;
    
    const analyticsData: AnalyticsData = {
      counts: {
        revenue: totalRevenue,
        orders: 0, // TODO: Calculate from orders table
        customers: totalContacts,
        suppliers: totalSuppliers,
        products: totalProducts,
        documents: 0 // TODO: Calculate from documents table
      },
      pricing: {
        average: 0, // TODO: Calculate from products
        minimum: 0,
        maximum: 0
      },
      revenue: {
        total: totalRevenue,
        previousPeriod: 0,
        percentChange: revenueGrowth
      },
      orders: {
        total: 0, // TODO: Calculate from orders
        previousPeriod: 0,
        percentChange: 0
      },
      customers: {
        total: totalContacts,
        previousPeriod: 0,
        percentChange: contactGrowth
      },
      suppliers: {
        total: totalSuppliers,
        previousPeriod: 0,
        percentChange: supplierGrowth
      }
    };
    
    return {
      ...analyticsData,
      organizationId
    };
  } catch (error) {
    console.error('Error in fetchAnalyticsServer:', error);
    // Fallback to empty data on error
    return {
      ...emptyAnalyticsData,
      organizationId
    };
  }
}

/**
 * Server-side function to fetch supplier distribution data
 */
export async function fetchSupplierDistributionServer() {
  const session = await getServerSession(authOptions);
  
  // Require authentication in all environments
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  try {
    const organizationId = session?.user?.id;
    
    // Direct database query instead of fetch
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Group by category and count
    const distribution = suppliers?.reduce((acc: any, supplier: any) => {
      const category = supplier.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};
    
    return Object.entries(distribution).map(([category, count]) => ({
      category,
      count: count as number
    }));
  } catch (error) {
    console.error('Error in fetchSupplierDistributionServer:', error);
    return [];
  }
}

/**
 * Server-side function to fetch product category distribution data
 */
export async function fetchProductDistributionServer() {
  const session = await getServerSession(authOptions);
  
  // Require authentication in all environments
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  try {
    const organizationId = session?.user?.id;
    
    // Direct database query instead of fetch
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Group by category and count
    const distribution = products?.reduce((acc: any, product: any) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};
    
    return Object.entries(distribution).map(([category, count]) => ({
      category,
      count: count as number
    }));
  } catch (error) {
    console.error('Error in fetchProductDistributionServer:', error);
    return [];
  }
}

/**
 * Server-side function to fetch price trends data
 */
export async function fetchPriceTrendsServer() {
  const session = await getServerSession(authOptions);
  
  // Require authentication in all environments
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  try {
    const organizationId = session?.user?.id;
    
    // Direct database query instead of fetch
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Calculate average price trends (simplified)
    const averagePrice = products?.length > 0 
      ? products.reduce((sum: number, product: any) => sum + (product.price || 0), 0) / products.length
      : 0;
    
    return [{
      month: new Date().toISOString().slice(0, 7),
      averagePrice
    }];
  } catch (error) {
    console.error('Error in fetchPriceTrendsServer:', error);
    return [];
  }
}
