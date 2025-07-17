import { SupplierDistribution, ProductDistribution, PriceTrend } from './types';

/**
 * Mock analytics data for development mode
 * Structure matches what AnalyticsDashboardClient expects
 */
export const mockAnalyticsData = {
  // Match the structure expected by the client component
  counts: {
    revenue: 125000,
    orders: 450,
    customers: 250,
    suppliers: 35,
    products: 180,
    documents: 95
  },
  pricing: {
    average: 149.99,
    minimum: 49.99,
    maximum: 299.99
  },
  // Keep the original structure for API compatibility
  revenue: {
    total: 125000,
    previousPeriod: 100000,
    percentChange: 25
  },
  orders: {
    total: 450,
    previousPeriod: 400,
    percentChange: 12.5
  },
  customers: {
    total: 250,
    previousPeriod: 200,
    percentChange: 25
  },
  suppliers: {
    total: 35,
    previousPeriod: 30,
    percentChange: 16.7
  }
};

/**
 * Mock supplier distribution data
 */
export const mockSupplierData = [
  { name: 'Supplier A', count: 120, reliabilityScore: 0.95 },
  { name: 'Supplier B', count: 80, reliabilityScore: 0.88 },
  { name: 'Supplier C', count: 60, reliabilityScore: 0.92 },
  { name: 'Supplier D', count: 40, reliabilityScore: 0.75 },
  { name: 'Supplier E', count: 30, reliabilityScore: 0.85 }
];

/**
 * Mock product distribution data
 */
export const mockProductData = [
  { name: 'Category A', value: 35 },
  { name: 'Category B', value: 25 },
  { name: 'Category C', value: 20 },
  { name: 'Category D', value: 15 },
  { name: 'Category E', value: 5 }
];

/**
 * Mock price trends data - will be replaced with real data
 */
export const mockPriceData: any[] = [
  // Mock data removed - will be replaced with real analytics data
];
