'use client';

import { useEffect, useState } from 'react';
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
  const orgSlug = initialData?.analyticsData?.organization?.slug?.toLowerCase?.();
  const orgName = initialData?.analyticsData?.organization?.name?.toLowerCase?.();
  const hideSuppliers = orgSlug === 'withcar' || orgName === 'withcar' || organizationId === '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
  const [error, setError] = useState<string | null>(null);
  const [aiSavings, setAiSavings] = useState<null | {
    time: { minutes: number; hours: number; workDays: number };
    cost: { hourlyRateUsd: number; savedUsd: number };
    breakdown: { minutesByType: Record<string, number> };
    headline?: string;
    topContributor?: string | null;
  }>(null);
  const [aiQuality, setAiQuality] = useState<null | {
    acceptanceRate: number;
    sampleSize: number;
    avgChanges: number;
    avgLengthChangePct: number;
    autoVsSemi: { autoApproved: number; requiresReview: number; completed: number };
  }>(null);

  useEffect(() => {
    // Fetch AI metrics for analytics view from production endpoint
    const fetchAi = async () => {
      try {
        const res = await fetch('/api/usage/dashboard-v2');
        if (res.ok) {
          const data = await res.json();
          if (data?.savings) setAiSavings({
            ...data.savings,
            headline: data.insights?.savings?.headline,
            topContributor: data.insights?.savings?.topContributor || data.insights?.efficiency?.mostUsedFeature || null
          });
          if (data?.quality) setAiQuality(data.quality);
        }
      } catch (e) {
        // Non-fatal: analytics still loads without AI metrics
        console.warn('AI metrics fetch failed', e);
      }
    };
    fetchAi();
  }, []);

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

      // Refresh AI metrics as well
      try {
        const aiRes = await fetch('/api/usage/dashboard-demo');
        if (aiRes.ok) {
          const ai = await aiRes.json();
          setAiSavings(ai.savings || null);
          setAiQuality(ai.quality || null);
        }
      } catch {}
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
          <div className={`grid gap-4 md:grid-cols-2 ${ hideSuppliers ? 'lg:grid-cols-3' : 'lg:grid-cols-4' }`}>
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
            {!hideSuppliers && (
              <StatCard
                title="Suppliers"
                value={analyticsData.counts.suppliers || 0}
                description="Total active suppliers"
                icon={<Building2 className="h-4 w-4" />}
                trend={getTrend(analyticsData.suppliers?.percentChange || 0)}
                trendValue={formatTrend(analyticsData.suppliers?.percentChange || 0)}
              />
            )}
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
         <TabsList className="grid w-full grid-cols-6 h-12 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 shadow-sm rounded-md">
          <TabsTrigger 
            value="overview" 
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-blue-200 transition-all duration-200"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="ai"
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-purple-200 transition-all duration-200"
          >
            AI
          </TabsTrigger>
          <TabsTrigger 
            value="subscriptions"
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-amber-200 transition-all duration-200"
          >
            Subscriptions
          </TabsTrigger>
          {!hideSuppliers && (
            <TabsTrigger 
              value="suppliers"
              className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-green-200 transition-all duration-200"
            >
              Suppliers
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="products"
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-pink-200 transition-all duration-200"
          >
            Products
          </TabsTrigger>
          <TabsTrigger 
            value="pricing"
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-indigo-200 transition-all duration-200"
          >
            Pricing
          </TabsTrigger>
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

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {aiSavings ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Time Saved (this month)</div>
                      <div className="text-2xl font-semibold">~{aiSavings.time.hours}h ({aiSavings.time.minutes} min)</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Cost Saved</div>
                      <div className="text-2xl font-semibold">${aiSavings.cost.savedUsd.toFixed(2)}</div>
                    </div>
                    {aiQuality && (
                      <>
                        <div>
                          <div className="text-sm text-muted-foreground">Acceptance</div>
                          <div className="text-2xl font-semibold">{aiQuality.acceptanceRate}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Auto approvals</div>
                          <div className="text-2xl font-semibold">{aiQuality.autoVsSemi.autoApproved}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {aiQuality && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg changes</div>
                        <div className="text-xl font-medium">{aiQuality.avgChanges}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg length delta %</div>
                        <div className="text-xl font-medium">{aiQuality.avgLengthChangePct}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Samples (30d)</div>
                        <div className="text-xl font-medium">{aiQuality.sampleSize}</div>
                      </div>
                    </div>
                  )}

                  {aiSavings.topContributor && (
                    <div className="text-sm text-muted-foreground">Top contributor: {aiSavings.topContributor.replace('_', ' ')}</div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">No AI usage yet. Connect an email account to start tracking savings.</div>
              )}
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

        {!hideSuppliers && (
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
        )}

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
