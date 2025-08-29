'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingBag, 
  Users, 
  Target,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface RevenueOverview {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface TopCustomer {
  name: string;
  revenue: number;
}

interface RevenueBreakdown {
  currency: string;
  amount: number;
  percentage: number;
}

interface RevenueInsights {
  bestPerformingDay: RevenueTrend | null;
  totalTransactions: number;
  averageDailyRevenue: number;
}

interface RevenueAnalyticsData {
  overview: RevenueOverview;
  trends: RevenueTrend[];
  topCustomers: TopCustomer[];
  revenueBreakdown: RevenueBreakdown[];
  insights: RevenueInsights;
}

interface RevenueAnalyticsProps {
  organizationId?: string;
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function RevenueAnalytics({ organizationId, className }: RevenueAnalyticsProps) {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadRevenueData();
  }, [organizationId, timeRange]);

  const loadRevenueData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);
      params.append('timeRange', timeRange);
      
      const response = await fetch(`/api/analytics/revenue?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch revenue analytics: ${response.statusText}`);
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      console.error('Error loading revenue analytics:', err);
      setError(err.message || 'Failed to load revenue analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number, decimals = 1): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <div className="space-y-2">
          <p className="text-gray-500">No revenue analytics data available</p>
          <p className="text-sm text-gray-400">
            {error || 'Add sales data to see revenue insights'}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={loadRevenueData}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Check if data is empty or undefined
  if (!data?.overview || data.overview.totalRevenue === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <div className="space-y-2">
          <p className="text-gray-500">No revenue data yet</p>
          <p className="text-sm text-gray-400">Your revenue analytics will appear here once you start making sales</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
          <p className="text-gray-600">Track your revenue performance and trends</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data?.overview?.totalRevenue || 0)}</p>
                <div className={`text-xs flex items-center mt-1 ${getTrendColor(data?.overview?.revenueGrowth || 0)}`}>
                  {getTrendIcon(data?.overview?.revenueGrowth || 0)}
                  <span className="ml-1">{formatNumber(Math.abs(data?.overview?.revenueGrowth || 0))}% vs last period</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{(data?.overview?.totalOrders || 0).toLocaleString()}</p>
                <div className={`text-xs flex items-center mt-1 ${getTrendColor(data?.overview?.ordersGrowth || 0)}`}>
                  {getTrendIcon(data?.overview?.ordersGrowth || 0)}
                  <span className="ml-1">{formatNumber(Math.abs(data?.overview?.ordersGrowth || 0))}% vs last period</span>
                </div>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(data?.overview?.averageOrderValue || 0)}</p>
                <div className={`text-xs flex items-center mt-1 ${getTrendColor(data?.overview?.aovGrowth || 0)}`}>
                  {getTrendIcon(data?.overview?.aovGrowth || 0)}
                  <span className="ml-1">{formatNumber(Math.abs(data?.overview?.aovGrowth || 0))}% vs last period</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Avg Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data?.insights?.averageDailyRevenue || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Over selected period</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.trends || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : name
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        {(data?.topCustomers?.length || 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.topCustomers || []).map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(customer.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Breakdown */}
        {(data?.revenueBreakdown?.length || 0) > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.revenueBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ currency, percentage }) => `${currency}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {(data?.revenueBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      {data?.insights?.bestPerformingDay && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Best Performing Day</p>
                <p className="text-lg font-bold">{data?.insights?.bestPerformingDay?.date}</p>
                <p className="text-sm text-green-600">
                  {formatCurrency(data?.insights?.bestPerformingDay?.revenue || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                <p className="text-lg font-bold">{data?.insights?.totalTransactions || 0}</p>
                <p className="text-sm text-blue-600">In selected period</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Daily Average</p>
                <p className="text-lg font-bold">{formatCurrency(data?.insights?.averageDailyRevenue || 0)}</p>
                <p className="text-sm text-purple-600">Revenue per day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
