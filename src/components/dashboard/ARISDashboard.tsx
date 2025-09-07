'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Target, 
  ArrowUpRight, 
  Brain,
  Clock,
  MessageSquare,
  Plus,
  Eye,
  BarChart3,
  Sparkles,
  Activity
} from "lucide-react";

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

interface ARISDashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  organization: any;
  session?: any;
}

export function ARISDashboard({ stats, loading, organization, session }: ARISDashboardProps) {
  // Debug logging
  console.log('🔍 ARISDashboard Debug:', { stats, loading, organization: organization?.name });
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-8">
                <Skeleton className="h-4 w-[100px] mb-4" />
                <Skeleton className="h-8 w-[150px] mb-2" />
                <Skeleton className="h-3 w-[80px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gradient animate-float">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
        </h1>
        <p className="text-muted-foreground">Here's your sales performance overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="metric-card hover-lift border-l-4 border-l-blue-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Leads</p>
                <p className="text-4xl font-bold text-foreground">{stats?.totalContacts || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 flex items-center font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Active contacts
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift border-l-4 border-l-green-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Conversion Rate</p>
                <p className="text-4xl font-bold text-foreground">{stats?.conversionRate ? `${stats.conversionRate}%` : '0%'}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl">
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 flex items-center font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {stats?.conversionGrowth ? `${stats.conversionGrowth}% from last month` : 'No data available'}
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift border-l-4 border-l-purple-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Email Accounts</p>
                <p className="text-4xl font-bold text-foreground">{stats?.emailAccounts || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-purple-600 flex items-center font-medium">
              <Activity className="h-3 w-3 mr-1" />
              Connected accounts
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift border-l-4 border-l-orange-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Products</p>
                <p className="text-4xl font-bold text-foreground">{stats?.totalProducts || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-orange-600 flex items-center font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              In catalog
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Usage Statistics - Real Data */}
        <Card className="lg:col-span-2 card-feature">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="icon-primary">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              AI Assistant Usage
            </CardTitle>
            <CardDescription>
              Track your AI-powered productivity and savings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{stats?.emailAccounts || 0}</div>
                <div className="text-sm text-blue-600">Email Accounts</div>
                <div className="text-xs text-muted-foreground mt-1">Connected</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{stats?.totalContacts || 0}</div>
                <div className="text-sm text-green-600">Active Leads</div>
                <div className="text-xs text-muted-foreground mt-1">In pipeline</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{stats?.totalProducts || 0}</div>
                <div className="text-sm text-purple-600">Products</div>
                <div className="text-xs text-muted-foreground mt-1">In catalog</div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-4">Get started with AI-powered features</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Assistant
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Voice Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-feature">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 3).map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    activity.color === 'green' ? 'bg-green-500 animate-pulse' :
                    activity.color === 'blue' ? 'bg-blue-500' :
                    activity.color === 'orange' ? 'bg-orange-500' :
                    activity.color === 'red' ? 'bg-red-500' :
                    'bg-primary'
                  )}></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground">Start engaging with leads to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <Card className="card-feature">
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Monitor your ongoing sales campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover-lift">
              <div className="flex items-center space-x-4">
                <div className="icon-primary">
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Q4 Enterprise Outreach</h4>
                  <p className="text-sm text-muted-foreground">Targeting Fortune 500 companies</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="badge-primary">Active</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">156 emails sent</p>
                  <p className="text-xs text-muted-foreground">23% open rate</p>
                </div>
                <Button variant="outline" size="sm" className="hover-lift">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover-lift">
              <div className="flex items-center space-x-4">
                <div className="icon-secondary">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-medium">SaaS Startup Follow-up</h4>
                  <p className="text-sm text-muted-foreground">Re-engaging warm leads</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">Scheduled</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">Starts tomorrow</p>
                  <p className="text-xs text-muted-foreground">89 prospects</p>
                </div>
                <Button variant="outline" size="sm" className="hover-lift">
                  Edit
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover-lift">
              <div className="flex items-center space-x-4">
                <div className="icon-primary">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Product Demo Series</h4>
                  <p className="text-sm text-muted-foreground">Converting trial users</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="badge-primary">Active</Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">12 demos booked</p>
                  <p className="text-xs text-muted-foreground">67% attendance</p>
                </div>
                <Button variant="outline" size="sm" className="hover-lift">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="btn-modern h-20 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Add Lead</span>
          </div>
        </Button>
        <Button className="btn-modern-outline h-20 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col items-center gap-2">
            <Mail className="h-5 w-5" />
            <span>New Campaign</span>
          </div>
        </Button>
        <Button className="btn-modern-outline h-20 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>View Analytics</span>
          </div>
        </Button>
        <Button className="btn-modern-outline h-20 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>AI Insights</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
