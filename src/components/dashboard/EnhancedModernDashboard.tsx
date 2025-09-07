'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Eye,
  CheckCircle,
  AlertCircle,
  Globe,
  Layers
} from 'lucide-react';

// Import MagicUI components
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid';
import { AnimatedBeam } from '@/components/magicui/animated-beam';
import { Marquee } from '@/components/magicui/marquee';
import { BorderBeam } from '@/components/magicui/border-beam';

// Types (keeping existing interface)
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

// Chart configurations (keeping existing)
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

// Generate sample trend data based on real stats (keeping existing logic)
const generateTrendData = (currentValue: number, months = 6) => {
  const data = [];
  const baseValue = Math.max(currentValue - 20, 0);
  
  for (let i = months - 1; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    
    const progress = (months - i) / months;
    const variance = Math.random() * 10 - 5;
    const value = Math.round(baseValue + (currentValue - baseValue) * progress + variance);
    
    data.push({
      month: monthName,
      leads: Math.max(value, 0),
    });
  }
  
  data[data.length - 1].leads = currentValue;
  return data;
};

// Generate conversion funnel data (keeping existing logic)
const generateConversionData = (totalLeads: number, conversionRate: number = 25) => {
  const converted = Math.round(totalLeads * (conversionRate / 100));
  const pending = totalLeads - converted;
  
  return [
    { name: "Converted", value: converted, color: "hsl(var(--primary))" },
    { name: "Pending", value: pending, color: "hsl(var(--muted))" },
  ];
};

// Success stories for Marquee
const successStories = [
  { client: "TechCorp", achievement: "187% increase in conversion rate", icon: "📈" },
  { client: "GrowthCo", achievement: "340% faster response time", icon: "⚡" },
  { client: "InnovateLtd", achievement: "156% larger deal sizes", icon: "💰" },
  { client: "ScaleCorp", achievement: "89% reduction in missed opportunities", icon: "🎯" },
  { client: "EfficiencyCo", achievement: "290% sales productivity boost", icon: "🚀" },
];

// AI Workflow Component for Animated Beams
const AIWorkflowVisualization: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const crmRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="relative h-48 w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6"
    >
      {/* Email Input */}
      <div 
        ref={emailRef}
        className="absolute top-6 left-6 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border"
      >
        <Mail className="w-6 h-6 text-blue-600" />
      </div>

      {/* AI Processing */}
      <div 
        ref={aiRef}
        className="absolute top-6 left-1/2 transform -translate-x-1/2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border"
      >
        <Brain className="w-6 h-6 text-purple-600" />
      </div>

      {/* CRM Integration */}
      <div 
        ref={crmRef}
        className="absolute bottom-6 left-1/3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border"
      >
        <Users className="w-6 h-6 text-green-600" />
      </div>

      {/* Analytics Output */}
      <div 
        ref={analyticsRef}
        className="absolute bottom-6 right-6 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border"
      >
        <BarChart3 className="w-6 h-6 text-orange-600" />
      </div>

      {/* Animated Beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={emailRef}
        toRef={aiRef}
        gradientStartColor="#3b82f6"
        gradientStopColor="#8b5cf6"
        delay={0}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={aiRef}
        toRef={crmRef}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#10b981"
        delay={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={aiRef}
        toRef={analyticsRef}
        gradientStartColor="#8b5cf6"
        gradientStopColor="#f59e0b"
        delay={2}
      />

      {/* Labels */}
      <div className="absolute top-12 left-6 text-xs text-blue-600 font-medium">Email</div>
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xs text-purple-600 font-medium">AI Process</div>
      <div className="absolute bottom-2 left-1/3 text-xs text-green-600 font-medium">CRM</div>
      <div className="absolute bottom-2 right-6 text-xs text-orange-600 font-medium">Analytics</div>
    </div>
  );
};

export function EnhancedModernDashboard({ 
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

  // Generate chart data based on real stats (keeping existing logic)
  const leadsTrendData = useMemo(() => {
    if (!stats) return [];
    return generateTrendData(stats.totalContacts);
  }, [stats?.totalContacts]);

  const conversionData = useMemo(() => {
    if (!stats) return [];
    return generateConversionData(stats.totalContacts, stats.conversionRate || 25);
  }, [stats?.totalContacts, stats?.conversionRate]);

  // Calculate growth percentages (keeping existing logic)
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
        
        <BentoGrid className="w-full auto-rows-[22rem] grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="col-span-1 rounded-xl">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </BentoGrid>
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

      {/* Success Stories Marquee */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-green-600" />
            Client Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Marquee className="py-2" pauseOnHover>
            {successStories.map((story, index) => (
              <div key={index} className="mx-4 flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                <span className="text-lg">{story.icon}</span>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{story.client}:</span>
                  <span className="text-gray-700 dark:text-gray-300 ml-1">{story.achievement}</span>
                </div>
              </div>
            ))}
          </Marquee>
        </CardContent>
      </Card>

      {/* Enhanced Bento Grid Dashboard */}
      <BentoGrid className="w-full auto-rows-[22rem] grid-cols-3 gap-4">
        {/* Key Metrics - Large Card */}
        <BentoCard
          name="Key Metrics Overview"
          className="col-span-2 row-span-1 relative"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="p-6 h-full">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="space-y-4">
                    <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm relative overflow-hidden">
                      <BorderBeam size={60} duration={12} delay={0} />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Leads</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats?.totalContacts || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="flex items-center text-xs mt-2">
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
                    </div>
                    
                    <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">Conversion Rate</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {stats?.conversionRate || 25}%
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Email Accounts</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats?.emailAccounts || 0}</p>
                        </div>
                        <Mail className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Products</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.totalProducts || 0}</p>
                        </div>
                        <Package className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
          Icon={BarChart3}
          description="Your key business metrics at a glance"
          href="/dashboard/analytics"
          cta="View Details"
        />

        {/* AI Workflow Visualization */}
        <BentoCard
          name="AI Processing Flow"
          className="col-span-1 row-span-1"
          background={<AIWorkflowVisualization />}
          Icon={Brain}
          description="Real-time AI agent workflow"
          href="/dashboard/agents"
          cta="View Agents"
        />

        {/* Leads Trend Chart */}
        <BentoCard
          name="Leads Trend Analysis"
          className="col-span-2 row-span-1"
          background={
            <div className="p-4 h-full">
              <ChartContainer config={leadsTrendConfig} className="h-full">
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
            </div>
          }
          Icon={TrendingUp}
          description="6-month lead acquisition trend"
          href="/dashboard/analytics"
          cta="View Analytics"
        />

        {/* Quick Actions */}
        <BentoCard
          name="Quick Actions"
          className="col-span-1 row-span-1"
          background={
            <div className="p-6 h-full">
              <div className="space-y-3">
                <Button asChild className="w-full justify-start relative overflow-hidden" variant="outline">
                  <Link href="/dashboard/leads/new">
                    <BorderBeam size={50} duration={8} delay={0} />
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
                    <Eye className="w-4 h-4 mr-2" />
                    View Reports
                  </Link>
                </Button>
              </div>
            </div>
          }
          Icon={Zap}
          description="Common tasks and shortcuts"
          href="#"
          cta="More Actions"
        />
      </BentoGrid>

      {/* Recent Activity - Traditional Layout (Preserved) */}
      <Card className="border-0 shadow-lg">
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

      {/* AI Insights Section - Enhanced with Border Beam */}
      {(aiSavings || aiQuality) && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 relative overflow-hidden">
          <BorderBeam size={100} duration={15} delay={0} />
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
                <Button asChild className="w-full relative overflow-hidden">
                  <Link href="/dashboard/email">
                    <BorderBeam size={50} duration={10} delay={0} />
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

