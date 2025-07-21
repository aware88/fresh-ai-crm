import { cookies } from 'next/headers';
import { getServerSession } from '@/lib/auth';
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
  // Use the custom getServerSession function that handles auth options internally
  const session = await getServerSession();
  
  // Debug session info
  debugLog('Session in fetchAnalyticsServer:', session ? 'exists' : 'missing');
  
  // Get organization ID from session or use dev ID in development
  const organizationId = session?.user?.id || (isDev() ? "dev-user-id" : "");
  debugLog('Organization ID:', organizationId);
  
  // In development mode, return sample data instead of empty data
  if (isDev()) {
    debugLog('Using sample analytics data in development mode');
    return {
      ...developmentAnalyticsData,
      organizationId
    };
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  if (!organizationId) {
    throw new Error('Unauthorized: No organization ID found');
  }
  
  try {
    // Use full URL for production, relative URL for development/server-side
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    const apiUrl = baseUrl ? `${baseUrl}/api/analytics` : '/api/analytics';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': (await cookies()).toString(),
      },
      next: { tags: ['analytics'] },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analytics data');
    }

    const data = await response.json();
    
    // Add organization ID to the response
    return {
      ...data,
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
  const session = await getServerSession();
  
  // In development mode, return sample data
  if (isDev()) {
    debugLog('Using sample supplier data in development mode');
    return [
      { name: "Tech Corp", count: 5, reliabilityScore: 85 },
      { name: "Global Supplies", count: 3, reliabilityScore: 92 },
      { name: "Local Materials", count: 4, reliabilityScore: 78 },
      { name: "Premium Parts", count: 2, reliabilityScore: 95 }
    ];
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    const apiUrl = baseUrl ? `${baseUrl}/api/analytics/suppliers` : '/api/analytics/suppliers';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': (await cookies()).toString(),
      },
      next: { tags: ['analytics-suppliers'] },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch supplier distribution data');
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchSupplierDistributionServer:', error);
    return [];
  }
}

/**
 * Server-side function to fetch product category distribution data
 */
export async function fetchProductDistributionServer() {
  const session = await getServerSession();
  
  // In development mode, return sample data
  if (isDev()) {
    debugLog('Using sample product data in development mode');
    return [
      { name: "Electronics", value: 8 },
      { name: "Tools", value: 5 },
      { name: "Materials", value: 3 },
      { name: "Components", value: 12 },
      { name: "Software", value: 2 }
    ];
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    const apiUrl = baseUrl ? `${baseUrl}/api/analytics/products` : '/api/analytics/products';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': (await cookies()).toString(),
      },
      next: { tags: ['analytics-products'] },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch product distribution data');
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchProductDistributionServer:', error);
    return [];
  }
}

/**
 * Server-side function to fetch price trends data
 */
export async function fetchPriceTrendsServer() {
  const session = await getServerSession();
  
  // In development mode, return sample data
  if (isDev()) {
    debugLog('Using sample price data in development mode');
    return [
      { name: "2024-01", min: 25, avg: 145, max: 450 },
      { name: "2024-02", min: 30, avg: 152, max: 425 },
      { name: "2024-03", min: 28, avg: 148, max: 480 },
      { name: "2024-04", min: 35, avg: 165, max: 520 }
    ];
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
    const apiUrl = baseUrl ? `${baseUrl}/api/analytics/pricing` : '/api/analytics/pricing';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': (await cookies()).toString(),
      },
      next: { tags: ['analytics-pricing'] },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch price trends data');
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchPriceTrendsServer:', error);
    return [];
  }
}
