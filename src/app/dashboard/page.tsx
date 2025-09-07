'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Mail,
  ShoppingCart,
  FileText,
  AlertCircle,
  Clock,
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  RefreshCw,
  Database
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { formatPriceUSD } from '@/lib/subscription-plans-v2';
import AnalyticsSummaryCards from '@/components/dashboard/AnalyticsSummaryCards';
import RecentActivityCards from '@/components/dashboard/RecentActivityCards';
import { ARISDashboard } from '@/components/dashboard/ARISDashboard';
import { ModernDashboard } from '@/components/dashboard/ModernDashboard';
import { EnhancedModernDashboard } from '@/components/dashboard/EnhancedModernDashboard';
import { Phase2EnhancedDashboard } from '@/components/dashboard/Phase2EnhancedDashboard';
import { Phase3RefinedDashboard } from '@/components/dashboard/Phase3RefinedDashboard';


// Types for dashboard statistics
interface DashboardStats {
  totalContacts: number;
  totalSuppliers: number;
  totalProducts: number;
  totalOrders: number;
  emailAccounts: number;
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { organization } = useOrganization();
  const isWithcar = (organization?.slug?.toLowerCase?.() === 'withcar') || (organization?.name?.toLowerCase?.() === 'withcar') || (organization?.id === '577485fb-50b4-4bb2-a4c6-54b97e1545ad');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [useARISView, setUseARISView] = useState(true);

  // Load dashboard preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('useARISView');
    if (savedPreference !== null) {
      setUseARISView(JSON.parse(savedPreference));
    }
  }, []); // Toggle between ARIS and original legacy view
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
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from APIs
        const [dashboardRes, usageRes, emailAccountsRes] = await Promise.all([
          fetch('/api/dashboard/overview').then(r => r.ok ? r.json() : null),
          fetch('/api/usage/dashboard-v2').then(r => r.ok ? r.json() : null),
          fetch('/api/dashboard/email-accounts').then(r => r.ok ? r.json() : null)
        ]);

        // Handle dashboard stats
        if (dashboardRes) {
          const stats: DashboardStats = {
            totalContacts: dashboardRes.totalContacts || 0,
            totalSuppliers: dashboardRes.totalSuppliers || 0,
            totalProducts: dashboardRes.totalProducts || 0,
            totalOrders: dashboardRes.totalOrders || 0,
            emailAccounts: emailAccountsRes?.count || dashboardRes.emailAccounts || 0,
            recentActivity: dashboardRes.recentActivity || []
          };
          console.log('📊 Dashboard stats from API:', stats);
          setStats(stats);
        } else {
          // No API data available, set empty stats
          const emptyStats: DashboardStats = {
            totalContacts: 0,
            totalSuppliers: 0,
            totalProducts: 0,
            totalOrders: 0,
            emailAccounts: 0,
            recentActivity: []
          };
          console.log('📊 No API data, using empty stats');
          setStats(emptyStats);
        }

        // Handle usage data if available
        if (usageRes && usageRes.savings) {
          setAiSavings({
            ...usageRes.savings,
            headline: usageRes.insights?.savings?.headline,
            topContributor: usageRes.insights?.savings?.topContributor || usageRes.insights?.efficiency?.mostUsedFeature || null
          });
        }

        if (usageRes && usageRes.quality) {
          setAiQuality(usageRes.quality);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (iconName: string) => {
    const icons = {
      Users: <Users className="h-4 w-4" />,
      Mail: <Mail className="h-4 w-4" />,
      Package: <Package className="h-4 w-4" />,
      Building2: <Building2 className="h-4 w-4" />,
      Sparkles: <Sparkles className="h-4 w-4" />
    };
    return icons[iconName as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const getActivityColorClass = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700',
      pink: 'bg-pink-100 text-pink-700'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  // Show Phase 3 Refined Dashboard by default
  if (useARISView) {
    return (
      <div>
        {/* Phase 3 Refined Dashboard - Clean, professional, subtle animations */}
        <Phase3RefinedDashboard 
          stats={stats}
          loading={loading}
          organization={organization}
          session={session}
          aiSavings={aiSavings}
          aiQuality={aiQuality}
        />
      </div>
    );
  }

  // Legacy Dashboard View (completely original layout)
  return (
    <>
      {/* Switch back to original layout for legacy view */}
      <div className="space-y-8 min-h-screen pb-8">
        {/* Dashboard Toggle */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setUseARISView(true)}
            className="btn-modern hover-lift"
          >
            Switch to Modern View
          </Button>
        </div>

      {/* Hero Section */}
      <div className="text-center py-8 rounded-2xl border border-gray-100 bg-white">
        <h1 className="text-4xl font-bold tracking-tight aris-text-gradient mb-2">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Here's an overview of your business performance and recent activity.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Button asChild>
            <Link href="/dashboard/email">
              <Sparkles className="mr-2 h-4 w-4" />
              Email Agent
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/analytics">
              <BarChart className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid gap-6 md:grid-cols-2 ${isWithcar ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Contacts</CardTitle>
            <div className="p-2 bg-blue-200 rounded-full">
              <Users className="h-4 w-4 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.totalContacts || 0}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats?.totalContacts ? `${stats.totalContacts > 1 ? 'Active contacts' : 'First contact added'}` : 'No contacts yet'}
            </p>
          </CardContent>
        </Card>

        {/* Hide Suppliers tile for Withcar only */}
        {!isWithcar && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Suppliers</CardTitle>
            <div className="p-2 bg-purple-200 rounded-full">
              <Building2 className="h-4 w-4 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats?.totalSuppliers || 0}</div>
            <p className="text-xs text-purple-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats?.totalSuppliers ? `${stats.totalSuppliers > 1 ? 'Active suppliers' : 'First supplier added'}` : 'No suppliers yet'}
            </p>
          </CardContent>
        </Card>
        )}

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Products</CardTitle>
            <div className="p-2 bg-green-200 rounded-full">
              <Package className="h-4 w-4 text-green-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats?.totalProducts ? `${stats.totalProducts > 1 ? 'Products in catalog' : 'First product added'}` : 'No products yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Email Accounts</CardTitle>
            <div className="p-2 bg-orange-200 rounded-full">
              <Mail className="h-4 w-4 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats?.emailAccounts || 0}</div>
            <p className="text-xs text-orange-600 flex items-center mt-1">
              <Activity className="h-3 w-3 mr-1" />
              {stats?.emailAccounts ? 'All accounts active' : 'No email accounts connected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
          <TabsTrigger 
            value="overview" 
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-blue-200 transition-all duration-200"
          >
            📊 Overview
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-indigo-200 transition-all duration-200"
          >
            🧠 AI Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="recent" 
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-green-200 transition-all duration-200"
          >
            🕒 Recent Activity
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-purple-200 transition-all duration-200"
          >
            ⚡ Quick Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-blue-600" />
                  Business Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Contacts</span>
                    <span className="font-semibold">{stats?.totalContacts || 0}</span>
                  </div>
                  {!(organization?.slug?.toLowerCase() === 'withcar' || organization?.name?.toLowerCase() === 'withcar') && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Suppliers</span>
                      <span className="font-semibold">{stats?.totalSuppliers || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Product Catalog</span>
                    <span className="font-semibold">{stats?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email Integrations</span>
                    <span className="font-semibold">{stats?.emailAccounts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                  AI Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiSavings && aiSavings.time && aiSavings.cost ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">This month</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Time Saved</p>
                          <p className="text-sm text-muted-foreground">~{aiSavings.time.hours || 0}h ({aiSavings.time.minutes || 0} min)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Cost Saved</p>
                          <p className="text-sm text-muted-foreground">${(aiSavings.cost.savedUsd || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      {aiQuality && (
                        <div className="grid grid-cols-3 gap-4 text-sm pt-2">
                          <div>
                            <p className="text-muted-foreground">Acceptance</p>
                            <p className="font-medium">{aiQuality.acceptanceRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg changes</p>
                            <p className="font-medium">{aiQuality.avgChanges}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Auto approvals</p>
                            <p className="font-medium">{aiQuality.autoVsSemi.autoApproved}</p>
                          </div>
                        </div>
                      )}
                      {aiSavings?.topContributor && (
                        <p className="text-xs text-muted-foreground">Top contributor: {aiSavings.topContributor.replace('_', ' ')}</p>
                      )}
                      <div className="pt-3 flex items-center gap-2">
                        <Button size="sm" asChild>
                          <Link href="/dashboard/email" className="inline-flex items-center w-full h-full">
                            Use Email Agent
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/analytics" className="inline-flex items-center w-full h-full">
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Connect AI features to start saving time</p>
                      <div className="pt-3 flex items-center gap-2">
                        <Button size="sm" asChild>
                          <Link href="/dashboard/email">Try Email Agent</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/ai-future">Explore CRM Assistant</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>


        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Summary Overview */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
                <p className="text-muted-foreground">
                  Quick insights into your AI performance, follow-ups, and revenue opportunities
                </p>
              </div>
              <Link href="/dashboard/analytics">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <BarChart className="mr-2 h-4 w-4" />
                  View Full Analytics
                </Button>
              </Link>
            </div>
            
            <AnalyticsSummaryCards />
            
            {/* Real Activity Data Cards */}
            <RecentActivityCards />
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest actions and system updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className={`p-2 rounded-full ${getActivityColorClass(activity.color)}`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-blue-200 rounded-full">
                    <Mail className="h-8 w-8 text-blue-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-blue-900">Connect Email</CardTitle>
                    <CardDescription className="text-blue-700">Link your business email accounts for AI analysis</CardDescription>
                  </div>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/settings/email-accounts">
                      <Plus className="mr-2 h-4 w-4" />
                      Connect Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-purple-200 rounded-full">
                    <Users className="h-8 w-8 text-purple-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-purple-900">Add Contact</CardTitle>
                    <CardDescription className="text-purple-700">Create a new customer contact profile</CardDescription>
                  </div>
                  <Button asChild variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-100">
                    <Link href="/dashboard/contacts/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organization-specific third card */}
            {organization?.slug?.toLowerCase() === 'withcar' || organization?.name?.toLowerCase() === 'withcar' ? (
              // Withcar: Metakocka Sync card
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-green-200 rounded-full">
                      <RefreshCw className="h-8 w-8 text-green-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-green-900">Sync Metakocka</CardTitle>
                      <CardDescription className="text-green-700">Synchronize products and contacts with Metakocka ERP</CardDescription>
                    </div>
                    <Button asChild variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                      <Link href="/settings/integrations/metakocka">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Manage Sync
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Default: Add Supplier card
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-green-200 rounded-full">
                      <Building2 className="h-8 w-8 text-green-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-green-900">Add Supplier</CardTitle>
                      <CardDescription className="text-green-700">Create a new supplier profile with AI insights</CardDescription>
                    </div>
                    <Button asChild variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                      <Link href="/dashboard/suppliers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Supplier
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-orange-200 rounded-full">
                    <Sparkles className="h-8 w-8 text-orange-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-orange-900">Email Agent</CardTitle>
                    <CardDescription className="text-orange-700">Analyze supplier communications with AI</CardDescription>
                  </div>
                  <Button asChild variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                    <Link href="/dashboard/email">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Start Analysis
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-pink-200 rounded-full">
                    <Package className="h-8 w-8 text-pink-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-pink-900">Manage Products</CardTitle>
                    <CardDescription className="text-pink-700">Add and organize your product catalog</CardDescription>
                  </div>
                  <Button asChild variant="outline" className="w-full border-pink-300 text-pink-700 hover:bg-pink-100">
                    <Link href="/dashboard/products">
                      <Package className="mr-2 h-4 w-4" />
                      View Products
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-indigo-200 rounded-full">
                    <BarChart className="h-8 w-8 text-indigo-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-indigo-900">View Analytics</CardTitle>
                    <CardDescription className="text-indigo-700">Deep insights into your business performance</CardDescription>
                  </div>
                  <Button asChild variant="outline" className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                    <Link href="/dashboard/analytics">
                      <BarChart className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}