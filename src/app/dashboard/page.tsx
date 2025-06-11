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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Email Analysis Card */}
        <Link href="/dashboard/email" className="block">
          <Card className="h-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-800">Email Analysis</h2>
                  <p className="text-blue-600 text-sm">AI-powered email psychology insights</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">Analyze customer emails to understand their personality and get AI-suggested responses.</p>
            </div>
          </Card>
        </Link>

        {/* Supplier Management Card */}
        <Link href="/dashboard/suppliers" className="block">
          <Card className="h-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full mr-4">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-800">Supplier Management</h2>
                  <p className="text-purple-600 text-sm">AI-powered supplier insights</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">Manage suppliers, upload documents, and get AI-powered insights for better procurement.</p>
            </div>
          </Card>
        </Link>

        {/* AI Assistant Card */}
        <Link href="/dashboard/assistant" className="block">
          <Card className="h-full border-0 shadow-lg overflow-hidden bg-gradient-to-br from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-800">AI Assistant</h2>
                  <p className="text-green-600 text-sm">Your intelligent business assistant</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">Get AI-powered assistance for your business needs, from answering questions to generating insights.</p>
            </div>
          </Card>
        </Link>
      </div>
      
      {/* Other Features */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Other Features</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contacts Card */}
        <Link href="/dashboard/contacts" className="block">
          <Card className="h-full border-0 shadow-md hover:shadow-lg bg-white hover:bg-gray-50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle>Contacts</CardTitle>
              </div>
              <CardDescription>
                Manage your customer contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage your customer contacts and their interaction history.</p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Analytics Card - Coming Soon */}
        <Card className="h-full border-0 shadow-md bg-gray-50">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-full mr-3">
                <BarChart3 className="h-5 w-5 text-gray-500" />
              </div>
              <CardTitle className="text-gray-500">Analytics</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Coming Soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Track and analyze customer engagement metrics with AI-driven insights.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
