'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Building2,
  RefreshCw,
  CreditCard,
  BarChart3
} from 'lucide-react';

import { AnalyticsData } from '@/lib/analytics/types';
import SubscriptionAnalytics from '@/components/analytics/SubscriptionAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

interface AnalyticsDashboardClientProps {
  initialData: {
    analyticsData: AnalyticsData;
    supplierData: Array<{name: string, count: number, reliabilityScore?: number}>;
    productData: Array<{name: string, value: number}>;
    priceData: Array<{name: string, min: number, avg: number, max: number}>;
  };
  organizationId: string;
}

const StatCard = ({ title, value, description, icon, trend, trendValue }: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-blue-100 p-1.5 text-blue-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-2 flex items-center text-xs">
          {trend === 'up' ? (
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
          ) : trend === 'down' ? (
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
          ) : null}
          <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}>
            {trendValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AnalyticsDashboardClient({ initialData, organizationId }: AnalyticsDashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState(initialData.analyticsData);
  const [supplierData, setSupplierData] = useState(initialData.supplierData);
  const [productData, setProductData] = useState(initialData.productData);
  const [priceData, setPriceData] = useState(initialData.priceData);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [analytics, supplierDist, productDist, priceTrends] = await Promise.all([
        fetch('/api/analytics').then(res => res.json()),
        fetch('/api/analytics/suppliers').then(res => res.json()),
        fetch('/api/analytics/products').then(res => res.json()),
        fetch('/api/analytics/pricing').then(res => res.json())
      ]);
      
      setAnalyticsData(analytics);
      setSupplierData(supplierDist);
      setProductData(productDist);
      setPriceData(priceTrends);
    } catch (err: any) {
      console.error('Error refreshing analytics data:', err);
      setError(err.message || 'Failed to refresh analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format trend values
  const formatTrend = (percentChange: number) => {
    if (percentChange === 0) return "No change from last month";
    const direction = percentChange > 0 ? "+" : "";
    return `${direction}${percentChange.toFixed(1)}% from last month`;
  };

  // Helper function to determine trend direction
  const getTrend = (percentChange: number): 'up' | 'down' | 'neutral' => {
    if (percentChange > 0) return 'up';
    if (percentChange < 0) return 'down';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">
            <p className="font-semibold">Error loading analytics data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {(isLoading || !analyticsData || !analyticsData.counts) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Loading analytics data...</p>
          <p className="text-sm text-gray-400">Please wait while we fetch your latest metrics</p>
        </div>
      ) : (
        <>
          {/* Analytics Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={`$${analyticsData.counts.revenue?.toLocaleString() || '0'}`}
              description="Revenue generated this month"
              icon={<DollarSign className="h-4 w-4" />}
              trend={getTrend(analyticsData.revenue?.percentChange || 0)}
              trendValue={formatTrend(analyticsData.revenue?.percentChange || 0)}
            />
            <StatCard
              title="Total Orders"
              value={analyticsData.counts.orders || 0}
              description="Orders processed this month"
              icon={<ShoppingBag className="h-4 w-4" />}
              trend={getTrend(analyticsData.orders?.percentChange || 0)}
              trendValue={formatTrend(analyticsData.orders?.percentChange || 0)}
            />
            <StatCard
              title="Customers"
              value={analyticsData.counts.customers || 0}
              description="Active customers this month"
              icon={<Users className="h-4 w-4" />}
              trend={getTrend(analyticsData.customers?.percentChange || 0)}
              trendValue={formatTrend(analyticsData.customers?.percentChange || 0)}
            />
            <StatCard
              title="Suppliers"
              value={analyticsData.counts.suppliers || 0}
              description="Total active suppliers"
              icon={<Building2 className="h-4 w-4" />}
              trend={getTrend(analyticsData.suppliers?.percentChange || 0)}
              trendValue={formatTrend(analyticsData.suppliers?.percentChange || 0)}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Products"
              value={analyticsData.counts.products || 0}
              description="Products in your catalog"
              icon={<ShoppingBag className="h-4 w-4" />}
              trend="neutral"
              trendValue="No change"
            />
            <StatCard
              title="Documents"
              value={analyticsData.counts.documents || 0}
              description="Sales documents created"
              icon={<CreditCard className="h-4 w-4" />}
              trend="neutral"
              trendValue="No change"
            />
            <StatCard
              title="Avg Price"
              value={`$${analyticsData.pricing?.average?.toFixed(2) || '0.00'}`}
              description={`Range: $${analyticsData.pricing?.minimum?.toFixed(2) || '0.00'} - $${analyticsData.pricing?.maximum?.toFixed(2) || '0.00'}`}
              icon={<DollarSign className="h-4 w-4" />}
              trend="neutral"
              trendValue="No change"
            />
          </div>
        </>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Your analytics overview shows key business metrics. Use the tabs above to explore specific areas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          {organizationId ? (
            <SubscriptionAnalytics organizationId={organizationId} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Organization ID not available. Please refresh the page.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {supplierData && supplierData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={supplierData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No supplier data available</p>
                  <p className="text-sm text-gray-400">Add suppliers to see distribution analytics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {productData && productData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                      >
                        {productData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No product data available</p>
                  <p className="text-sm text-gray-400">Add products to see category distribution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {priceData && priceData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="min" fill="#ff7300" name="Min Price" />
                      <Bar dataKey="avg" fill="#387908" name="Avg Price" />
                      <Bar dataKey="max" fill="#8884d8" name="Max Price" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No pricing data available</p>
                  <p className="text-sm text-gray-400">Add product pricing to see trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
