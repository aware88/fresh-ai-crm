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
  
  // In development mode, return mock data
  if (isDev()) {
    debugLog('Using mock analytics data in development mode');
    return {
      ...mockAnalyticsData,
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies().toString(),
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
    throw error;
  }
}

/**
 * Server-side function to fetch supplier distribution data
 */
export async function fetchSupplierDistributionServer() {
  const session = await getServerSession();
  
  // In development mode, return mock data
  if (isDev()) {
    debugLog('Using mock supplier data in development mode');
    return mockSupplierData;
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/suppliers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies().toString(),
    },
    next: { tags: ['analytics-suppliers'] },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch supplier distribution data');
  }

  return response.json();
}

/**
 * Server-side function to fetch product category distribution data
 */
export async function fetchProductDistributionServer() {
  const session = await getServerSession();
  
  // In development mode, return mock data
  if (isDev()) {
    debugLog('Using mock product data in development mode');
    return mockProductData;
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/products`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies().toString(),
    },
    next: { tags: ['analytics-products'] },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch product distribution data');
  }

  return response.json();
}

/**
 * Server-side function to fetch price trends data
 */
export async function fetchPriceTrendsServer() {
  const session = await getServerSession();
  
  // In development mode, return mock data
  if (isDev()) {
    debugLog('Using mock price data in development mode');
    return mockPriceData;
  }
  
  // In production, require authentication
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/pricing`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies().toString(),
    },
    next: { tags: ['analytics-pricing'] },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch price trends data');
  }

  return response.json();
}
