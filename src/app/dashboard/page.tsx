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
  MessageSquare,
  FileText,
  AlertCircle,
  Clock,
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
  Building2
} from 'lucide-react';
import { useSession } from 'next-auth/react';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDashboardData = async () => {
        try {
          const [contactsRes, suppliersRes, productsRes, emailStatusRes] = await Promise.all([
            fetch('/api/contacts').then(r => r.ok ? r.json() : { contacts: [] }),
            fetch('/api/suppliers').then(r => r.ok ? r.json() : { suppliers: [] }),
            fetch('/api/products').then(r => r.ok ? r.json() : { products: [] }),
            fetch('/api/email/status').then(r => r.ok ? r.json() : { accounts: [] })
          ]);

          // Calculate statistics
          const totalContacts = contactsRes.contacts?.length || 0;
          const totalSuppliers = suppliersRes.suppliers?.length || 0;
          const totalProducts = productsRes.products?.length || 0;
          const emailAccounts = emailStatusRes.accounts?.length || 0;

          // Enhanced recent activity with better design
          const recentActivity = [
            { 
              id: '1',
              type: 'contact', 
              title: 'New Contact Added',
              message: 'John Smith from Acme Corp was added to your contacts', 
              time: '2 hours ago',
              icon: 'Users',
              color: 'blue'
            },
            { 
              id: '2',
              type: 'email', 
              title: 'Supplier Email Received',
              message: 'New price quote from TechSupply Co.', 
              time: '3 hours ago',
              icon: 'Mail',
              color: 'green'
            },
            { 
              id: '3',
              type: 'product', 
              title: 'Product Price Updated',
              message: 'Updated pricing for Widget Pro 2000', 
              time: '5 hours ago',
              icon: 'Package',
              color: 'orange'
            },
            { 
              id: '4',
              type: 'supplier', 
              title: 'New Supplier Added',
              message: 'GlobalTech Solutions added to supplier database', 
              time: '1 day ago',
              icon: 'Building2',
              color: 'purple'
            },
            { 
              id: '5',
              type: 'analysis', 
              title: 'AI Analysis Complete',
              message: 'Email personality analysis completed for 5 contacts', 
              time: '2 days ago',
              icon: 'Sparkles',
              color: 'pink'
            }
          ];

          setStats({ 
            totalContacts, 
            totalSuppliers, 
            totalProducts, 
            totalOrders: 0, 
            emailAccounts,
            recentActivity 
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [status]);

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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Here's an overview of your business performance and recent activity.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/dashboard/email">
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Emails
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
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
              {stats?.totalContacts ? '+2 since last month' : 'No contacts yet'}
            </p>
          </CardContent>
        </Card>

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
              {stats?.totalSuppliers ? '+5 since last month' : 'No suppliers yet'}
            </p>
          </CardContent>
        </Card>

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
              {stats?.totalProducts ? '+12 since last month' : 'No products yet'}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Suppliers</span>
                    <span className="font-semibold">{stats?.totalSuppliers || 0}</span>
                  </div>
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
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Analysis</p>
                      <p className="text-sm text-muted-foreground">AI-powered personality insights</p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/email">Try Now</Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Supplier Intelligence</p>
                      <p className="text-sm text-muted-foreground">Smart procurement insights</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/suppliers">Explore</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-blue-50 to-blue-100">
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100">
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-orange-200 rounded-full">
                    <Sparkles className="h-8 w-8 text-orange-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-orange-900">Email Analysis</CardTitle>
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-pink-50 to-pink-100">
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
  );
}