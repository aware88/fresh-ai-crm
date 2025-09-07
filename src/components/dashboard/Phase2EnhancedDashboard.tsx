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
import { BentoGrid, BentoCard } from '@/components/magicui/bento-grid';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import { RippleButton } from '@/components/ui/ripple-button';
import { GradientBackground, PremiumBackground, SuccessBackground } from '@/components/ui/gradient-background';
import { Sparkles, SparkleEffect } from '@/components/magicui/sparkles';
import { AIProcessingVisualization } from '@/components/ai/AIProcessingVisualization';
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
  Sparkles as SparklesIcon
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
  ResponsiveContainer
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

interface Phase2EnhancedDashboardProps {
  stats: DashboardStats;
  loading: boolean;
  organization?: any;
  session?: any;
  aiSavings?: number;
  aiQuality?: number;
}

export function Phase2EnhancedDashboard({
  stats,
  loading,
  organization,
  session,
  aiSavings = 0,
  aiQuality = 0
}: Phase2EnhancedDashboardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(true);

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 40000 },
    { month: 'Feb', revenue: 52000, target: 45000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 55000 },
    { month: 'May', revenue: 55000, target: 60000 },
    { month: 'Jun', revenue: 67000, target: 65000 },
  ];

  const conversionData = [
    { stage: 'Leads', value: 1000, color: '#3b82f6' },
    { stage: 'Qualified', value: 750, color: '#8b5cf6' },
    { stage: 'Proposal', value: 400, color: '#06b6d4' },
    { stage: 'Closed', value: 150, color: '#10b981' },
  ];

  useEffect(() => {
    // Simulate AI processing completion
    const timer = setTimeout(() => {
      setAiProcessing(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
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

  const features = [
    {
      Icon: Brain,
      name: "AI Processing Pipeline",
      description: "Real-time AI analysis and insights generation",
      href: "/dashboard/ai",
      cta: "View Pipeline",
      className: "col-span-3 lg:col-span-1",
      background: (
        <AIProcessingVisualization 
          isProcessing={aiProcessing}
          className="absolute inset-0 opacity-80"
        />
      ),
    },
    {
      Icon: BarChart3,
      name: "Revenue Analytics",
      description: `$${(stats.revenue || 0).toLocaleString()} this month`,
      href: "/dashboard/analytics",
      cta: "View Details",
      className: "col-span-3 lg:col-span-2",
      background: (
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#revenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      Icon: Users,
      name: "Lead Conversion",
      description: `${stats.conversionRate}% conversion rate`,
      href: "/dashboard/leads",
      cta: "Manage Leads",
      className: "col-span-3 lg:col-span-1",
      background: (
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                paddingAngle={5}
                dataKey="value"
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      Icon: MessageSquare,
      name: "AI Communication Hub",
      description: `${stats.emailsSent} emails sent, ${stats.responseRate}% response rate`,
      href: "/dashboard/communications",
      cta: "View Messages",
      className: "col-span-3 lg:col-span-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10" />
      ),
    },
    {
      Icon: Target,
      name: "Performance Metrics",
      description: `${stats.tasksCompleted} tasks completed this week`,
      href: "/dashboard/performance",
      cta: "View Metrics",
      className: "col-span-3 lg:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
      ),
    },
  ];

  return (
    <GradientBackground variant="default" animated className="min-h-screen">
      <div className="space-y-8 p-6">
        {/* Header with Sparkles */}
        <div className="flex items-center justify-between">
          <div>
            <SparkleEffect intensity="low" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ARIS Dashboard
              </h1>
            </SparkleEffect>
            <p className="text-muted-foreground mt-2">
              Agentic Relationship Intelligence System
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Activity className="h-3 w-3 mr-1" />
              AI Active
            </Badge>
            <RippleButton variant="premium" rippleEffect="strong">
              <AnimatedShinyText className="text-white">
                ✨ Upgrade to Pro
              </AnimatedShinyText>
            </RippleButton>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SuccessBackground>
            <Card className="bg-transparent border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-400">
                  Total Contacts
                </CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <Sparkles trigger={showConfetti} count={5} className="inline-block">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.totalContacts?.toLocaleString() || '0'}
                  </div>
                </Sparkles>
                <p className="text-xs text-green-400/80">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
          </SuccessBackground>

          <PremiumBackground>
            <Card className="bg-transparent border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-400">
                  Active Leads
                </CardTitle>
                <Target className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {stats.activeLeads?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-purple-400/80">
                  +8% from last week
                </p>
              </CardContent>
            </Card>
          </PremiumBackground>

          <GradientBackground variant="info">
            <Card className="bg-transparent border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-400">
                  Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  ${(stats.revenue || 0).toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-blue-400/80">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% from last month
                </div>
              </CardContent>
            </Card>
          </GradientBackground>

          <GradientBackground variant="warning">
            <Card className="bg-transparent border-yellow-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-400">
                  AI Insights
                </CardTitle>
                <Brain className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.aiInsights || '0'}
                </div>
                <p className="text-xs text-yellow-400/80">
                  Generated today
                </p>
              </CardContent>
            </Card>
          </GradientBackground>
        </div>

        {/* Enhanced Bento Grid */}
        <BentoGrid>
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>

        {/* AI Quality Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <PremiumBackground>
            <Card className="bg-transparent border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Zap className="h-5 w-5" />
                  AI Performance
                </CardTitle>
                <CardDescription className="text-purple-400/80">
                  Real-time AI system metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">Processing Speed</span>
                    <span className="text-purple-400 font-medium">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">Accuracy</span>
                    <span className="text-purple-400 font-medium">{aiQuality}%</span>
                  </div>
                  <Progress value={aiQuality} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-400">Cost Savings</span>
                    <span className="text-purple-400 font-medium">${aiSavings}</span>
                  </div>
                  <Progress value={(aiSavings / 10000) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </PremiumBackground>

          <SuccessBackground>
            <Card className="bg-transparent border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Award className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
                <CardDescription className="text-green-400/80">
                  Your latest milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <SparkleEffect intensity="low">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-400">
                          100% Email Delivery Rate
                        </p>
                        <p className="text-xs text-green-400/80">
                          Achieved yesterday
                        </p>
                      </div>
                    </div>
                  </SparkleEffect>
                  
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/5">
                    <Target className="h-4 w-4 text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-400">
                        Monthly Revenue Goal Exceeded
                      </p>
                      <p className="text-xs text-green-400/80">
                        115% of target reached
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/5">
                    <Brain className="h-4 w-4 text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-400">
                        AI Model Optimization
                      </p>
                      <p className="text-xs text-green-400/80">
                        30% improvement in accuracy
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SuccessBackground>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <RippleButton variant="default" rippleEffect="normal" asChild>
            <Link href="/dashboard/leads">
              <Users className="h-4 w-4 mr-2" />
              Manage Leads
            </Link>
          </RippleButton>
          
          <RippleButton variant="outline" rippleEffect="subtle" asChild>
            <Link href="/dashboard/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </RippleButton>
          
          <RippleButton variant="success" rippleEffect="normal" asChild>
            <Link href="/dashboard/ai">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </Link>
          </RippleButton>
          
          <RippleButton variant="premium" rippleEffect="strong">
            <SparklesIcon className="h-4 w-4 mr-2" />
            <AnimatedShinyText className="text-white">
              Generate Report
            </AnimatedShinyText>
          </RippleButton>
        </div>
      </div>
    </GradientBackground>
  );
}

