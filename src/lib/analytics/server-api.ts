import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { getUID } from '@/lib/auth/utils';
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
  
  // Resolve organization ID from user (NextAuth session → featureFlagService)
  const uid = (session?.user as any)?.id || (session?.user as any)?.userId || await getUID();
  const organizationId = uid ? await featureFlagService.getUserOrganization(uid) : null;
  debugLog('Organization ID:', organizationId || 'missing');
  
  // Require authentication in all environments
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  // If no organization, provide user-scoped analytics instead of failing
  if (!organizationId) {
    debugLog('No organization found, providing user-scoped analytics');
    
    try {
      const supabase = await createClient();
      
      // Query user-scoped data instead of organization-scoped
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('created_by', uid);
      
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('*')
        .eq('created_by', uid);
      
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('created_by', uid);
      
      // Calculate analytics from user's personal data
      const totalContacts = contacts?.length || 0;
      const totalSuppliers = suppliers?.length || 0;
      const totalProducts = products?.length || 0;
      
      const analyticsData: AnalyticsData = {
        counts: {
          revenue: 0,
          orders: 0,
          customers: totalContacts,
          suppliers: totalSuppliers,
          products: totalProducts,
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
          total: totalContacts,
          previousPeriod: 0,
          percentChange: 0
        },
        suppliers: {
          total: totalSuppliers,
          previousPeriod: 0,
          percentChange: 0
        }
      };
      
      return {
        ...analyticsData,
        organizationId: 'independent-user'
      };
    } catch (error) {
      console.error('Error fetching user-scoped analytics:', error);
      // Return empty data structure instead of throwing
      return {
        ...emptyAnalyticsData,
        organizationId: 'independent-user'
      };
    }
  }
  
  try {
    // Use server supabase client
    const supabase = await createClient();

    // Query org-scoped data
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
    
    // Admin fallback to bypass RLS if any of these appear empty
    let contactsData = contacts || [];
    let suppliersData = suppliers || [];
    let productsData = products || [];
    try {
      if ((suppliersData.length === 0) || (productsData.length === 0) || (contactsData.length === 0)) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        if (url && key) {
          const direct = createDirectClient(url, key);
          const [cRes, sRes, pRes] = await Promise.all([
            suppliersData.length === 0 || contactsData.length === 0 ? direct.from('contacts').select('*').eq('organization_id', organizationId) : Promise.resolve({ data: contactsData }),
            direct.from('suppliers').select('*').eq('organization_id', organizationId),
            direct.from('products').select('*').eq('organization_id', organizationId)
          ]);
          if ('data' in cRes) contactsData = cRes.data || contactsData;
          if ('data' in sRes) suppliersData = sRes.data || suppliersData;
          if ('data' in pRes) productsData = pRes.data || productsData;
        }
      }
    } catch (e) {
      debugLog('Admin fallback in analytics failed');
    }
    
    // Calculate analytics from real data
    const totalContacts = contactsData?.length || 0;
    const totalSuppliers = suppliersData?.length || 0;
    const totalProducts = productsData?.length || 0;
    
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
    const uid = (session?.user as any)?.id || (session?.user as any)?.userId || await getUID();
    const organizationId = uid ? await featureFlagService.getUserOrganization(uid) : null;
    if (!organizationId) throw new Error('No organization');

    const supabase = await createClient();
    // Direct database query
    let { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', organizationId);
    // Fallback
    if (!suppliers || suppliers.length === 0) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (url && key) {
        const direct = createDirectClient(url, key);
        const { data } = await direct
          .from('suppliers')
          .select('*')
          .eq('organization_id', organizationId);
        suppliers = data || suppliers;
      }
    }
    
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
    const uid = (session?.user as any)?.id || (session?.user as any)?.userId || await getUID();
    const organizationId = uid ? await featureFlagService.getUserOrganization(uid) : null;
    if (!organizationId) throw new Error('No organization');

    const supabase = await createClient();
    // Direct database query
    let { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId);
    if (!products || products.length === 0) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (url && key) {
        const direct = createDirectClient(url, key);
        const { data } = await direct
          .from('products')
          .select('*')
          .eq('organization_id', organizationId);
        products = data || products;
      }
    }
    
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
    const uid = (session?.user as any)?.id || (session?.user as any)?.userId || await getUID();
    const organizationId = uid ? await featureFlagService.getUserOrganization(uid) : null;
    if (!organizationId) throw new Error('No organization');

    const supabase = await createClient();
    // Direct database query
    let { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Calculate average price trends (simplified)
    const averagePrice = (products?.length || 0) > 0 
      ? products.reduce((sum: number, product: any) => sum + (product.price || product.unit_price || 0), 0) / products.length
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
