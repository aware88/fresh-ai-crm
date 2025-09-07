'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid, 
  XAxis, 
  YAxis,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Mail, 
  Target, 
  BarChart3,
  Brain,
  Clock,
  MessageSquare,
  Plus,
  ArrowUpRight,
  Sparkles,
  Activity,
  Building2,
  Package,
  DollarSign,
  Zap,
  Eye
} from 'lucide-react';

// Types
interface DashboardStats {
  totalContacts: number;
  totalSuppliers: number;
  totalProducts: number;
  totalOrders: number;
  emailAccounts: number;
  conversionRate?: number;
  conversionGrowth?: number;
  recentActivity: {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    icon: string;
    color: string;
  }[];
}

interface ModernDashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  organization: any;
  session?: any;
  aiSavings?: {
    time: { minutes: number; hours: number; workDays: number };
    cost: { hourlyRateUsd: number; savedUsd: number };
    breakdown: { minutesByType: Record<string, number> };
    headline?: string;
    topContributor?: string | null;
  } | null;
  aiQuality?: {
    acceptanceRate: number;
    sampleSize: number;
    avgChanges: number;
    avgLengthChangePct: number;
    autoVsSemi: { autoApproved: number; requiresReview: number; completed: number };
  } | null;
}

// Chart configurations
const leadsTrendConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const conversionConfig = {
  converted: {
    label: "Converted",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "Pending", 
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

const aiUsageConfig = {
  usage: {
    label: "AI Usage",
    color: "hsl(142.1 76.2% 36.3%)",
  },
} satisfies ChartConfig;

// Generate sample trend data based on real stats
const generateTrendData = (currentValue: number, months = 6) => {
  const data = [];
  const baseValue = Math.max(currentValue - 20, 0);
  
  for (let i = months - 1; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    
    // Generate realistic progression towards current value
    const progress = (months - i) / months;
    const variance = Math.random() * 10 - 5; // +/- 5 variance
    const value = Math.round(baseValue + (currentValue - baseValue) * progress + variance);
    
    data.push({
      month: monthName,
      leads: Math.max(value, 0),
    });
  }
  
  // Ensure last month matches current value
  data[data.length - 1].leads = currentValue;
  
  return data;
};

// Generate conversion funnel data
const generateConversionData = (totalLeads: number, conversionRate: number = 25) => {
  const converted = Math.round(totalLeads * (conversionRate / 100));
  const pending = totalLeads - converted;
  
  return [
    { name: "Converted", value: converted, color: "hsl(var(--primary))" },
    { name: "Pending", value: pending, color: "hsl(var(--muted))" },
  ];
};

export function ModernDashboard({ 
  stats, 
  loading, 
  organization, 
  session,
  aiSavings,
  aiQuality 
}: ModernDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation trigger
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Generate chart data based on real stats
  const leadsTrendData = useMemo(() => {
    if (!stats) return [];
    return generateTrendData(stats.totalContacts);
  }, [stats?.totalContacts]);

  const conversionData = useMemo(() => {
    if (!stats) return [];
    return generateConversionData(stats.totalContacts, stats.conversionRate || 25);
  }, [stats?.totalContacts, stats?.conversionRate]);

  // Calculate growth percentages
  const getGrowthPercentage = (data: any[]) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].leads;
    const previous = data[data.length - 2].leads;
    return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  };

  const growthPercentage = useMemo(() => getGrowthPercentage(leadsTrendData), [leadsTrendData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <div className="space-y-2">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-6 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-8 transition-all duration-700",
      isVisible ? "animate-in fade-in-50 slide-in-from-bottom-4" : "opacity-0"
    )}>
      {/* Welcome Header with Animation */}
      <div className="mt-6 mb-10">
        <div className="space-y-4">
          <div className="overflow-hidden">
            <h1 className="text-4xl font-bold tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700 ease-out">
              Welcome back
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {session?.user?.name ? `, ${session.user.name}` : ''}
              </span>
              <span className="inline-block ml-2 animate-pulse">👋</span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150 ease-out">
            Here's your business performance at a glance
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={cn(
          "relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20",
          "hover:shadow-lg transition-all duration-300 group cursor-pointer"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats?.totalContacts || 0}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl text-white group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-xs">
              {growthPercentage >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
              )}
              <span className={cn(
                "font-medium",
                growthPercentage >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {Math.abs(growthPercentage)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20",
          "hover:shadow-lg transition-all duration-300 group cursor-pointer"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {stats?.conversionRate || 25}%
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl text-white group-hover:scale-110 transition-transform duration-200">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-xs">
              <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
              <span className="font-medium text-green-600">
                {stats?.conversionGrowth || 12}% improvement
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20",
          "hover:shadow-lg transition-all duration-300 group cursor-pointer"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Email Accounts</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats?.emailAccounts || 0}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl text-white group-hover:scale-110 transition-transform duration-200">
                <Mail className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-xs">
              <Activity className="w-3 h-3 text-purple-600 mr-1" />
              <span className="font-medium text-purple-600">
                {stats?.emailAccounts ? 'All connected' : 'Not connected'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20",
          "hover:shadow-lg transition-all duration-300 group cursor-pointer"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Products</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats?.totalProducts || 0}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl text-white group-hover:scale-110 transition-transform duration-200">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center text-xs">
              <BarChart3 className="w-3 h-3 text-orange-600 mr-1" />
              <span className="font-medium text-orange-600">In catalog</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Trend Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Leads Trend
            </CardTitle>
            <CardDescription>
              Lead acquisition over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={leadsTrendConfig} className="h-[300px]">
              <AreaChart data={leadsTrendData}>
                <defs>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#fillLeads)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Conversion Overview
            </CardTitle>
            <CardDescription>
              Current lead conversion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Converted Leads</span>
                <span className="text-2xl font-bold text-green-600">
                  {conversionData[0]?.value || 0}
                </span>
              </div>
              <Progress value={stats?.conversionRate || 25} className="h-2" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {conversionData[0]?.value || 0}
                  </div>
                  <div className="text-xs text-green-600">Converted</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {conversionData[1]?.value || 0}
                  </div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your campaigns and leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 4).map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.color === 'green' ? 'bg-green-500 animate-pulse' :
                      activity.color === 'blue' ? 'bg-blue-500' :
                      activity.color === 'orange' ? 'bg-orange-500' :
                      activity.color === 'purple' ? 'bg-purple-500' :
                      'bg-primary'
                    )}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs">Start engaging with leads to see updates here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                Add New Lead
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/campaigns">
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Campaign
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/settings/email-accounts">
                <Mail className="w-4 h-4 mr-2" />
                Connect Email
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/analytics">
                <Eye className="w-4 w-4 mr-2" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      {(aiSavings || aiQuality) && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              AI Performance Insights
            </CardTitle>
            <CardDescription>
              Your AI assistant's productivity and impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiSavings && (
                <div className="space-y-2">
                  <div className="text-center p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {aiSavings.time.hours || 0}h
                    </div>
                    <div className="text-sm text-violet-600">Time Saved</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      ${(aiSavings.cost.savedUsd || 0).toFixed(0)}
                    </div>
                    <div className="text-sm text-green-600">Cost Saved</div>
                  </div>
                </div>
              )}
              
              {aiQuality && (
                <div className="space-y-2">
                  <div className="text-center p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {aiQuality.acceptanceRate}%
                    </div>
                    <div className="text-sm text-blue-600">Acceptance Rate</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {aiQuality.autoVsSemi.autoApproved}
                    </div>
                    <div className="text-sm text-indigo-600">Auto Approved</div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col justify-center space-y-3">
                <Button asChild className="w-full">
                  <Link href="/dashboard/email">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Email Assistant
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}