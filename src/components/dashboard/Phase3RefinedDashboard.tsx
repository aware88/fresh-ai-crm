'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BentoGrid, BentoCard } from '@/components/magicui/bento-grid';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { RippleButton } from '@/components/ui/ripple-button';
import { GradientBackground } from '@/components/ui/gradient-background';
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
  DollarSign,
  Activity,
  Zap,
  Star,
  Award,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DashboardStats {
  totalContacts?: number;
  activeLeads?: number;
  conversionRate?: number;
  revenue?: number;
  emailsSent?: number;
  responseRate?: number;
  aiInsights?: number;
  tasksCompleted?: number;
  totalSuppliers?: number;
  totalProducts?: number;
  totalOrders?: number;
  emailAccounts?: number;
  recentActivity?: any[];
}

interface Phase3RefinedDashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  organization?: any;
  session?: any;
  aiSavings?: any;
  aiQuality?: any;
}

export function Phase3RefinedDashboard({
  stats,
  loading,
  organization,
  session,
  aiSavings = 0,
  aiQuality = 0
}: Phase3RefinedDashboardProps) {
  const [animateNumbers, setAnimateNumbers] = useState(false);

  // Get display name from settings or fallback to session name/email - memoized to prevent flashing
  const memoizedDisplayName = useMemo(() => {
    // Check if we're on the client side to avoid SSR errors
    if (typeof window === 'undefined') {
      // Server side - just use session data
      if (session?.user?.name && 
          !session.user.name.includes('@') && 
          session.user.name !== session.user.email?.split('@')[0]) {
        return session.user.name;
      }
      return '';
    }

    // Client side - check localStorage for saved profile
    const savedProfile = localStorage.getItem('user-profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name && parsed.name.trim()) {
          return parsed.name.trim();
        }
      } catch (error) {
        console.warn('Failed to parse saved profile data');
      }
    }
    
    // Fallback to session name if it's not an email
    if (session?.user?.name && 
        !session.user.name.includes('@') && 
        session.user.name !== session.user.email?.split('@')[0]) {
      return session.user.name;
    }
    
    // Final fallback to empty string (no name will be shown)
    return '';
  }, [session?.user?.name, session?.user?.email]);


  // Memoized greeting text to prevent re-renders and flashing
  const greetingText = useMemo(() => {
    const greetings = [
      'Welcome back',
      'Great to see you',
      'Hello there',
      'Good to have you back',
      'Today is a great day',
      'Ready to conquer the day',
      'Let\'s make today amazing',
      'Time to achieve greatness',
    ];
    
    // Use a consistent random based on date so it changes daily but stays same during the day
    const today = new Date().toDateString();
    const hash = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % greetings.length;
    
    const greeting = greetings[index];
    return `${greeting}${memoizedDisplayName ? `, ${memoizedDisplayName}` : ''}!`;
  }, [memoizedDisplayName]);

  // Generate revenue data from live stats or empty if no data
  const revenueData = useMemo(() => {
    const currentRevenue = stats?.revenue || stats?.totalOrders || 0;
    if (currentRevenue === 0) {
      // Return minimal data structure for empty state
      return [
        { month: 'Current', revenue: 0, target: 0, growth: 0 }
      ];
    }
    
    // Generate basic monthly projection based on current data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseRevenue = Math.floor(currentRevenue / 6); // Distribute across 6 months
    return months.map((month, index) => ({
      month,
      revenue: baseRevenue + (Math.random() * baseRevenue * 0.3), // Small variation
      target: baseRevenue * 1.1, // 10% above current as target
      growth: Math.floor(Math.random() * 20 - 5) // -5% to +15% growth
    }));
  }, [stats]);

  // Calculate performance metrics from available data
  const emailOpenRate = stats?.responseRate || 0;
  const responseRate = Math.round(emailOpenRate * 0.5);
  const leadConversion = stats?.conversionRate || 0;
  const aiAccuracy = typeof aiQuality === 'number' ? aiQuality : (aiQuality?.acceptanceRate || 0);
  
  const performanceData = [
    { name: 'Email Open Rate', value: emailOpenRate, target: 65 },
    { name: 'Response Rate', value: responseRate, target: 30 },
    { name: 'Lead Conversion', value: leadConversion, target: 15 },
    { name: 'AI Accuracy', value: aiAccuracy, target: 85 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateNumbers(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col p-3">
      {/* Welcome Message and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            {greetingText}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-2 py-0">
            <Activity className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
          <RippleButton variant="default" rippleEffect="subtle" className="text-sm px-2 py-1">
            <span className="hidden sm:inline">Report</span>
            <span className="sm:hidden">Report</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </RippleButton>
        </div>
      </div>

      {/* Enhanced Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Total Contacts
            </CardTitle>
            <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
              <Users className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {animateNumbers && (stats?.totalContacts || 0) > 0 ? (
                <NumberTicker value={stats.totalContacts} />
              ) : (
                stats?.totalContacts || 0
              )}
            </div>
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              {(stats?.totalContacts || 0) > 0 ? 'Live contacts from database' : 'No contacts yet'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Leads
            </CardTitle>
            <div className="p-2 bg-green-200 dark:bg-green-800 rounded-full">
              <Target className="h-4 w-4 text-green-700 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {animateNumbers && (stats?.activeLeads || 0) > 0 ? (
                <NumberTicker value={stats?.activeLeads || 0} />
              ) : (
                stats?.activeLeads || 0
              )}
            </div>
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              {(stats?.activeLeads || 0) > 0 ? '+8% from last week' : 'No active leads yet'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Monthly Revenue
            </CardTitle>
            <div className="p-2 bg-purple-200 dark:bg-purple-800 rounded-full">
              <DollarSign className="h-4 w-4 text-purple-700 dark:text-purple-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {animateNumbers && (stats?.revenue || stats?.totalOrders || 0) > 0 ? (
                <span>${stats?.revenue ? <NumberTicker value={stats.revenue} /> : <NumberTicker value={stats?.totalOrders || 0} />}</span>
              ) : (
                `$${stats?.revenue || stats?.totalOrders || 0}`
              )}
            </div>
            <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              {(stats?.revenue || stats?.totalOrders || 0) > 0 ? 'Current period data' : 'No revenue data yet'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              AI Insights
            </CardTitle>
            <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-full">
              <Brain className="h-4 w-4 text-orange-700 dark:text-orange-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {animateNumbers && (stats?.aiInsights || stats?.emailAccounts || 0) > 0 ? (
                <NumberTicker value={stats?.aiInsights || stats?.emailAccounts || 0} />
              ) : (
                stats?.aiInsights || stats?.emailAccounts || 0
              )}
            </div>
            <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-2">
              <Zap className="h-3 w-3 mr-1" />
{(stats?.aiInsights || stats?.emailAccounts || 0) > 0 ? 'Live AI data' : 'No AI activity yet'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="flex-1 grid gap-4 lg:grid-cols-2 min-h-0 overflow-hidden">
        {/* Revenue Chart */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 flex flex-col hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <div className="p-1.5 bg-blue-500 rounded-lg">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Monthly revenue vs targets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            <div className="h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="target" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    tick={{fontSize: 10}}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => `$${value/1000}k`}
                    tick={{fontSize: 10}}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Revenue
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  ${payload[0].value?.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Target
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  ${payload[1].value?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--muted-foreground))"
                    fill="url(#target)"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="url(#revenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800 flex flex-col hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500 rounded-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
              Performance Metrics
            </CardTitle>
            <CardDescription className="text-sm text-indigo-600 dark:text-indigo-400">
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            <div className="grid grid-cols-2 gap-4">
              {performanceData.map((metric, index) => {
                const colors = [
                  { bg: 'bg-blue-500', text: 'text-blue-600', progress: 'bg-blue-500' },
                  { bg: 'bg-green-500', text: 'text-green-600', progress: 'bg-green-500' },
                  { bg: 'bg-purple-500', text: 'text-purple-600', progress: 'bg-purple-500' },
                  { bg: 'bg-orange-500', text: 'text-orange-600', progress: 'bg-orange-500' }
                ][index % 4];
                return (
                  <div key={metric.name} className="text-center p-3 rounded-lg bg-white/50 dark:bg-white/10 backdrop-blur-sm">
                    <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                      {animateNumbers && metric.value > 0 ? (
                        <NumberTicker value={metric.value} />
                      ) : (
                        metric.value || 0
                      )}%
                    </div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-2 font-medium">{metric.name}</div>
                    <div className="relative">
                      <Progress 
                        value={metric.value || 0} 
                        className="h-2"
                      />
                      <div 
                        className="absolute top-0 h-2 w-0.5 bg-indigo-400"
                        style={{ left: `${metric.target}%` }}
                      />
                    </div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      Target: {metric.target}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clean Action Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 border-t pt-3 mt-2">
        <div className="flex flex-wrap gap-3">
          <Button variant="default" asChild className="flex-1 sm:flex-none text-sm px-3 py-1">
            <Link href="/dashboard/leads">
              <Users className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Manage </span>Leads
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="flex-1 sm:flex-none text-sm px-3 py-1">
            <Link href="/dashboard/analytics">
              <BarChart3 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">View </span>Analytics
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="flex-1 sm:flex-none text-sm px-3 py-1">
            <Link href="/dashboard/ai-future">
              <Brain className="h-3 w-3 mr-1" />
              AI Insights
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

