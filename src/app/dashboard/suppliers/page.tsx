'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArisPageHeader } from '@/components/ui/aris-page-header';
import { ArisStatsCard } from '@/components/ui/aris-stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, Users, Upload, Mail, Brain, History, Search, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import SupplierList from '@/components/suppliers/SupplierList';
import DocumentUploader from '@/components/suppliers/DocumentUploader';
import EmailParser from '@/components/suppliers/EmailParser';
import SupplierAIChat from '@/components/suppliers/SupplierAIChat';
import HistoryViewer from '@/components/suppliers/HistoryViewer';

// Mock stats data
const supplierStats = [
  {
    title: "Total Suppliers",
    value: "247",
    change: "+12%",
    trend: "up" as const,
    icon: Users,
    color: "#3B82F6"
  },
  {
    title: "Active Contracts",
    value: "189",
    change: "+8%",
    trend: "up" as const,
    icon: FileText,
    color: "#8B5CF6"
  },
  {
    title: "Pending Orders",
    value: "23",
    change: "-5%",
    trend: "down" as const,
    icon: Package,
    color: "#EC4899"
  },
  {
    title: "Quality Issues",
    value: "3",
    change: "-15%",
    trend: "down" as const,
    icon: AlertTriangle,
    color: "#F59E0B"
  }
];

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header with ARIS Branding */}
      <ArisPageHeader
        title="Suppliers"
        description="Manage suppliers, upload documents, analyze emails, and get AI-powered insights"
        icon={Users}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supplierStats.map((stat, index) => (
          <ArisStatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
            index={index}
          />
        ))}
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search suppliers, documents, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6 p-1 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
            <TabsTrigger 
              value="suppliers" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-100 data-[state=active]:hover:opacity-90"
            >
              <Users className="h-4 w-4" /> Suppliers
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-100 data-[state=active]:hover:opacity-90"
            >
              <Upload className="h-4 w-4" /> Upload Center
            </TabsTrigger>
            <TabsTrigger 
              value="emails" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-100 data-[state=active]:hover:opacity-90"
            >
              <Mail className="h-4 w-4" /> Email Parser
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-100 data-[state=active]:hover:opacity-90"
            >
              <Brain className="h-4 w-4" /> AI Assistant
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-100 data-[state=active]:hover:opacity-90"
            >
              <History className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="mt-0">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-full mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Supplier Management</CardTitle>
                    <CardDescription className="text-white/90">
                      View, add, edit, and delete suppliers
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <SupplierList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-full mr-3">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Document Upload Center</CardTitle>
                    <CardDescription className="text-white/90">
                      Upload and manage supplier documents such as offers, CoAs, specifications, and invoices
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <DocumentUploader />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="mt-0">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-full mr-3">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Email Parser</CardTitle>
                    <CardDescription className="text-white/90">
                      Paste supplier emails to extract and store important information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <EmailParser />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-full mr-3">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">AI Sourcing Assistant</CardTitle>
                    <CardDescription className="text-white/90">
                      Ask questions about suppliers, products, and get recommendations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <SupplierAIChat />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-full mr-3">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Query History</CardTitle>
                    <CardDescription className="text-white/90">
                      View past AI queries and results
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <HistoryViewer />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
