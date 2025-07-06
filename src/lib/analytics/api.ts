/**
 * Client-side API functions for analytics
 */

export interface SubscriptionAnalyticsData {
  overview: {
    totalRevenue: number;
    lastMonthRevenue: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    revenueGrowth: number;
  };
  planDistribution: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface AnalyticsData {
  counts: {
    suppliers: number;
    products: number;
    documents: number;
    emails: number;
  };
  pricing: {
    average: number;
    minimum: number;
    maximum: number;
  };
}

/**
 * Fetch analytics data from the API
 */
export async function fetchAnalytics(): Promise<AnalyticsData> {
  const response = await fetch('/api/analytics', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch analytics data');
  }

  return response.json();
}

/**
 * Fetch supplier distribution data
 */
export async function fetchSupplierDistribution() {
  const response = await fetch('/api/analytics/suppliers', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch supplier distribution data');
  }

  return response.json();
}

/**
 * Fetch product category distribution data
 */
export async function fetchProductDistribution() {
  const response = await fetch('/api/analytics/products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch product distribution data');
  }

  return response.json();
}

/**
 * Fetch price trend data
 */
export async function fetchPriceTrends() {
  const response = await fetch('/api/analytics/pricing', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch price trend data');
  }

  return response.json();
}

/**
 * Fetch subscription analytics data
 */
export async function fetchSubscriptionAnalytics(organizationId: string): Promise<SubscriptionAnalyticsData> {
  const response = await fetch(`/api/analytics/subscriptions?organizationId=${organizationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch subscription analytics data');
  }

  return response.json();
}
