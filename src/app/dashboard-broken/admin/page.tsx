import { Metadata } from 'next';
import { DashboardShell } from '@/components/shell';
import { DashboardHeader } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bell, Users, CreditCard, Package2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'System administration and management',
};

export default function AdminDashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Admin Dashboard"
        text="System administration and management tools"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Users</div>
            <p className="text-xs text-muted-foreground">Manage system users and permissions</p>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/dashboard/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Organizations</div>
            <p className="text-xs text-muted-foreground">Manage organizations and their settings</p>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/dashboard/admin/organizations">Manage Organizations</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Subscriptions</div>
            <p className="text-xs text-muted-foreground">Manage subscription plans and billing</p>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/dashboard/admin/subscriptions">Manage Subscriptions</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Notifications</div>
            <p className="text-xs text-muted-foreground">Manage system notifications and jobs</p>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/dashboard/admin/notifications">Manage Notifications</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">System Analytics</div>
            <p className="text-xs text-muted-foreground">View system-wide analytics and metrics</p>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link href="/dashboard/admin/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
