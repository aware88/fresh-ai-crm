import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AI CRM dashboard
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/email" className="block">
          <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Email Analysis</CardTitle>
              <CardDescription>
                Analyze emails with AI to extract insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Use our AI to analyze customer emails and get actionable insights.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Manage your customer contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Coming soon: Organize and manage your customer contacts.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              View customer engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Coming soon: Track and analyze customer engagement metrics.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
