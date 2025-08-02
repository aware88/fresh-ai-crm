import { Suspense } from 'react';
import { fetchAnalyticsServer, fetchSupplierDistributionServer, fetchProductDistributionServer, fetchPriceTrendsServer } from '@/lib/analytics/server-api';
import AnalyticsDashboardClient from './components/AnalyticsDashboardClient';
import { Card, CardContent } from "@/components/ui/card";

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';

// Loading component for Suspense
function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 bg-muted/20 animate-pulse rounded-md"></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl"></div>
        ))}
      </div>
      <div className="h-8 w-96 bg-muted/20 animate-pulse rounded-md"></div>
      <div className="h-96 bg-muted/20 animate-pulse rounded-xl"></div>
    </div>
  );
}

// Server component that fetches data and passes it to the client component
export default async function AnalyticsDashboard() {
  try {
    // Server-side data fetching with authentication handled by the API functions
    console.log('Starting data fetch in analytics page');
  
    // Fetch all data in parallel
    const [analyticsData, supplierData, productData, priceData] = await Promise.all([
      fetchAnalyticsServer(),
      fetchSupplierDistributionServer(),
      fetchProductDistributionServer(),
      fetchPriceTrendsServer()
    ]);
    
    // If we got here, authentication was successful in the API calls
    // Extract organization ID from analytics data if available
    const organizationId = analyticsData?.organizationId || "";
    console.log('Data fetch successful, organizationId:', organizationId);
    
    // Pass data to client component with correct structure
    return (
      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsDashboardClient 
          initialData={{
            analyticsData,
            supplierData,
            productData,
            priceData
          }}
          organizationId={organizationId}
        />
      </Suspense>
    );
  } catch (error: any) {
    console.error('Error loading analytics data:', error);
    
    // Check if this is an authentication error
    if (error.message?.includes('Unauthorized') || error.message?.includes('No session')) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You must be signed in to view analytics.</p>
          </CardContent>
        </Card>
      );
    }
    
    // Other errors
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">Failed to load analytics data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
}
