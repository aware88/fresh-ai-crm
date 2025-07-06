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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  RefreshCw,
  CreditCard
} from 'lucide-react';

import { fetchSubscriptionAnalytics, SubscriptionAnalyticsData } from '@/lib/analytics/api';

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

interface SubscriptionAnalyticsProps {
  organizationId: string;
}

export default function SubscriptionAnalytics({ organizationId }: SubscriptionAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<SubscriptionAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!organizationId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchSubscriptionAnalytics(organizationId);
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Error loading subscription analytics data:', err);
        setError(err.message || 'Failed to load subscription analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [organizationId]);

  const handleRefresh = async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchSubscriptionAnalytics(organizationId);
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Error refreshing subscription analytics data:', err);
      setError(err.message || 'Failed to refresh subscription analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Subscription Analytics</h2>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-8 bg-gray-200 rounded-t"></CardHeader>
              <CardContent className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Subscription Analytics</h2>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-700">
              <p className="font-semibold">Error loading analytics data</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Subscription Analytics</h2>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No subscription data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Subscription Analytics</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analyticsData.overview.totalRevenue)}
          description="Total subscription revenue"
          icon={<DollarSign className="h-4 w-4" />}
          trend="neutral"
          trendValue="All time"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(analyticsData.overview.lastMonthRevenue)}
          description="Last month's revenue"
          icon={<DollarSign className="h-4 w-4" />}
          trend={analyticsData.overview.revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(analyticsData.overview.revenueGrowth).toFixed(1)}% from previous month`}
        />
        <StatCard
          title="Active Subscriptions"
          value={analyticsData.overview.activeSubscriptions}
          description="Current active subscriptions"
          icon={<CreditCard className="h-4 w-4" />}
          trend="neutral"
          trendValue="Current count"
        />
        <StatCard
          title="Pending Cancellations"
          value={analyticsData.overview.cancelledSubscriptions}
          description="Subscriptions set to cancel"
          icon={<Users className="h-4 w-4" />}
          trend={analyticsData.overview.cancelledSubscriptions > 0 ? 'down' : 'neutral'}
          trendValue={analyticsData.overview.cancelledSubscriptions > 0 ? 'Attention needed' : 'No cancellations'}
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="plans">Plan Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData.monthlyRevenue}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#3b82f6" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.planDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string, percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.planDistribution}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
