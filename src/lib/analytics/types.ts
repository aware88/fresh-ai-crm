// Analytics data types

/**
 * Main analytics data interface that matches the structure expected by AnalyticsDashboardClient
 */
export interface AnalyticsData {
  // Summary counts used in stat cards
  counts: {
    revenue: number;
    orders: number;
    customers: number;
    suppliers: number;
    products: number;
    documents: number;
  };
  
  // Pricing information
  pricing: {
    average: number;
    minimum: number;
    maximum: number;
  };
  
  // Original API structure preserved for compatibility
  revenue: {
    total: number;
    previousPeriod: number;
    percentChange: number;
  };
  orders: {
    total: number;
    previousPeriod: number;
    percentChange: number;
  };
  customers: {
    total: number;
    previousPeriod: number;
    percentChange: number;
  };
  suppliers: {
    total: number;
    previousPeriod: number;
    percentChange: number;
  };
}

export interface SupplierDistribution {
  name: string;
  count: number;
  reliabilityScore?: number;
}

export interface ProductDistribution {
  name: string;
  value: number;
}

export interface PriceTrend {
  name: string;
  min: number;
  avg: number;
  max: number;
}
