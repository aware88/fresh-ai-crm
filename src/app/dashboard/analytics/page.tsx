'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
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
  RefreshCw
} from 'lucide-react';

import { fetchAnalytics, fetchSupplierDistribution, fetchProductDistribution, fetchPriceTrends } from '@/lib/analytics/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
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

export default function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState({
    counts: {
      suppliers: 0,
      products: 0,
      documents: 0,
      emails: 0,
    },
    pricing: {
      average: 0,
      minimum: 0,
      maximum: 0,
    }
  });
  const [supplierData, setSupplierData] = useState<Array<{name: string, count: number, reliabilityScore?: number}>>([]);
  const [productData, setProductData] = useState<Array<{name: string, value: number}>>([]);
  const [priceData, setPriceData] = useState<Array<{name: string, min: number, avg: number, max: number}>>([]);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [analytics, suppliers, products, pricing] = await Promise.all([
          fetchAnalytics(),
          fetchSupplierDistribution(),
          fetchProductDistribution(),
          fetchPriceTrends()
        ]);
        
        setAnalyticsData(analytics);
        setSupplierData(suppliers);
        setProductData(products);
        setPriceData(pricing);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [analytics, suppliers, products, pricing] = await Promise.all([
        fetchAnalytics(),
        fetchSupplierDistribution(),
        fetchProductDistribution(),
        fetchPriceTrends()
      ]);
      
      setAnalyticsData(analytics);
      setSupplierData(suppliers);
      setProductData(products);
      setPriceData(pricing);
    } catch (err) {
      console.error('Error refreshing analytics data:', err);
      setError('Failed to refresh analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Suppliers"
              value={analyticsData.counts.suppliers.toString()}
              description="Active suppliers in your network"
              icon={<Building2 className="h-5 w-5" />}
              trend="up"
              trendValue="Updated today"
            />
            <StatCard
              title="Total Products"
              value={analyticsData.counts.products.toString()}
              description="Products in your catalog"
              icon={<ShoppingBag className="h-5 w-5" />}
              trend="up"
              trendValue="Updated today"
            />
            <StatCard
              title="Average Price"
              value={`$${analyticsData.pricing.average.toFixed(2)}`}
              description="Average product price"
              icon={<DollarSign className="h-5 w-5" />}
              trend="neutral"
              trendValue="Updated today"
            />
            <StatCard
              title="Documents"
              value={analyticsData.counts.documents.toString()}
              description="Documents in the system"
              icon={<Users className="h-5 w-5" />}
              trend="neutral"
              trendValue="Updated today"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Top Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={supplierData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
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
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    <Tooltip />
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
                    <Tooltip />
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
                    <Tooltip />
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
