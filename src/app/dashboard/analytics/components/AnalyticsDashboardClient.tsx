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
      {/* Remove error message, show empty state if any data is empty or error */}
      {(isLoading || !analyticsData || !analyticsData.counts || !supplierData || !productData || !priceData || error) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No analytics data yet</p>
          <p className="text-sm text-gray-400">Your analytics will appear here as you use the system</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Suppliers"
            value={analyticsData.counts.suppliers}
            description="Active suppliers in your system"
            icon={<Building2 className="h-4 w-4" />}
            trend="up"
            trendValue="+12% from last month"
          />
          <StatCard
            title="Total Products"
            value={analyticsData.counts.products}
            description="Products in your inventory"
            icon={<ShoppingBag className="h-4 w-4" />}
            trend="up"
            trendValue="+8% from last month"
          />
          <StatCard
            title="Documents"
            value={analyticsData.counts.documents}
            description="Sales documents created"
            icon={<Users className="h-4 w-4" />}
            trend="neutral"
            trendValue="No change from last month"
          />
          <StatCard
            title="Average Price"
            value={`$${analyticsData.pricing.average.toFixed(2)}`}
            description={`Range: $${analyticsData.pricing.minimum.toFixed(2)} - $${analyticsData.pricing.maximum.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4" />}
            trend="down"
            trendValue="-3% from last month"
          />
        </div>
      )}
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Trends</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <Bar dataKey="min" fill="#22c55e" name="Min Price" />
                    <Bar dataKey="avg" fill="#3b82f6" name="Avg Price" />
                    <Bar dataKey="max" fill="#ef4444" name="Max Price" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
