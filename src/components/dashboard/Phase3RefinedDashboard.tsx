'use client';

import React, { useState, useEffect } from 'react';
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
import { TypingAnimation } from '@/components/magicui/typing-animation';
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
  totalContacts: number;
  activeLeads: number;
  conversionRate: number;
  revenue: number;
  emailsSent: number;
  responseRate: number;
  aiInsights: number;
  tasksCompleted: number;
}

interface Phase3RefinedDashboardProps {
  stats: DashboardStats;
  loading: boolean;
  organization?: any;
  session?: any;
  aiSavings?: number;
  aiQuality?: number;
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

  // Enhanced mock data with smoother curves
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 40000, growth: 12 },
    { month: 'Feb', revenue: 52000, target: 45000, growth: 15 },
    { month: 'Mar', revenue: 48000, target: 50000, growth: 8 },
    { month: 'Apr', revenue: 61000, target: 55000, growth: 27 },
    { month: 'May', revenue: 55000, target: 60000, growth: -10 },
    { month: 'Jun', revenue: 67000, target: 65000, growth: 22 },
  ];

  const performanceData = [
    { name: 'Email Open Rate', value: 68, target: 65 },
    { name: 'Response Rate', value: 34, target: 30 },
    { name: 'Lead Conversion', value: 12, target: 15 },
    { name: 'AI Accuracy', value: aiQuality, target: 85 },
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
    <div className="space-y-8 p-6">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            <TypingAnimation
              className="text-muted-foreground"
              text="Welcome back! Here's what's happening with your business."
              duration={50}
            />
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            <Activity className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
          <RippleButton variant="default" rippleEffect="subtle">
            Generate Report
            <ChevronRight className="h-4 w-4 ml-1" />
          </RippleButton>
        </div>
      </div>

      {/* Enhanced Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {animateNumbers ? (
                <NumberTicker value={stats.totalContacts || 0} />
              ) : (
                '0'
              )}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Leads
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {animateNumbers ? (
                <NumberTicker value={stats.activeLeads || 0} />
              ) : (
                '0'
              )}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8% from last week
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {animateNumbers ? (
                <span>$<NumberTicker value={stats.revenue || 0} /></span>
              ) : (
                '$0'
              )}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Insights
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {animateNumbers ? (
                <NumberTicker value={stats.aiInsights || 0} />
              ) : (
                '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue vs targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
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
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Performance Metrics</CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData.map((metric, index) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{metric.name}</span>
                  <span className="text-muted-foreground">
                    {animateNumbers ? (
                      <NumberTicker value={metric.value} />
                    ) : (
                      '0'
                    )}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={animateNumbers ? metric.value : 0} 
                    className="h-2"
                  />
                  <div 
                    className="absolute top-0 h-2 w-0.5 bg-muted-foreground/50"
                    style={{ left: `${metric.target}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="text-xs">Target: {metric.target}%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Clean Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="default" asChild>
          <Link href="/dashboard/leads">
            <Users className="h-4 w-4 mr-2" />
            Manage Leads
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/dashboard/analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/dashboard/ai">
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </Link>
        </Button>
      </div>
    </div>
  );
}

