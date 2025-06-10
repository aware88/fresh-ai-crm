import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Users, BarChart3, Settings, Sparkles, ArrowRight, Building2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 mt-4">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI CRM Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Powerful AI tools to enhance your customer relationships
        </p>
      </div>
      
      {/* Featured Cards */}
      <div className="space-y-6">
        {/* Email Analysis Card */}
        <div className="mb-4">
          <Link href="/dashboard/email" className="block">
            <Card className="w-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-800">Email Analysis</h2>
                      <p className="text-blue-600">AI-powered email psychology insights</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">Analyze customer emails to understand their personality, communication style, and get AI-suggested responses tailored to their psychology.</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Analyze Emails <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-600 p-8 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Mail className="h-16 w-16 mx-auto mb-4 opacity-90" />
                    <p className="font-medium">Unlock the psychology behind every email</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Supplier Management Card */}
        <div className="mb-4">
          <Link href="/suppliers" className="block">
            <Card className="w-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-100 rounded-full mr-4">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-purple-800">Supplier Management</h2>
                      <p className="text-purple-600">AI-powered supplier insights and analysis</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">Manage suppliers, upload documents, parse emails, and get AI-powered insights to optimize your procurement and sourcing decisions.</p>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Manage Suppliers <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="md:w-1/3 bg-gradient-to-br from-purple-600 to-blue-600 p-8 flex items-center justify-center">
                  <div className="text-white text-center">
                    <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-90" />
                    <p className="font-medium">Optimize your sourcing and procurement</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
      
      {/* Other Features */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Other Features</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Settings Card */}
        <Link href="/dashboard/settings" className="block">
          <Card className="h-full border-0 shadow-md hover:shadow-lg bg-white hover:bg-gray-50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full mr-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle>Settings</CardTitle>
              </div>
              <CardDescription>
                Configure your AI CRM system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Upload personality profiles and set your user identity for more accurate analysis.</p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Contacts Card - Coming Soon */}
        <Card className="h-full border-0 shadow-md bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-full mr-3">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <CardTitle>Contacts</CardTitle>
            </div>
            <CardDescription>
              Manage your customer contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-gray-500">Coming soon: Organize and manage your customer contacts with AI insights.</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Analytics Card - Coming Soon */}
        <Card className="h-full border-0 shadow-md bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-full mr-3">
                <BarChart3 className="h-5 w-5 text-gray-500" />
              </div>
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>
              View customer engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Coming soon: Track and analyze customer engagement metrics with AI-driven insights.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
