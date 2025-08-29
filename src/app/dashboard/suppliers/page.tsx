'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Upload, Mail, Brain, History } from 'lucide-react';
import SupplierList from '@/components/suppliers/SupplierList';
import DocumentUploader from '@/components/suppliers/DocumentUploader';
import EmailParser from '@/components/suppliers/EmailParser';
import SupplierAIChat from '@/components/suppliers/SupplierAIChat';
import HistoryViewer from '@/components/suppliers/HistoryViewer';

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState('suppliers');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">
          Manage suppliers, upload documents, analyze emails, and get AI-powered insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6 p-1 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
          <TabsTrigger 
            value="suppliers" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Users className="h-4 w-4" /> Suppliers
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Upload className="h-4 w-4" /> Upload Center
          </TabsTrigger>
          <TabsTrigger 
            value="emails" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Mail className="h-4 w-4" /> Email Parser
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Brain className="h-4 w-4" /> AI Assistant
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-[color-mix(in_oklab,var(--accent-color)_10%,white)] overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Supplier Management</CardTitle>
                  <CardDescription className="text-white/80">
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
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-[color-mix(in_oklab,var(--accent-color)_10%,white)] overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Document Upload Center</CardTitle>
                  <CardDescription className="text-white/80">
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
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-[color-mix(in_oklab,var(--accent-color)_10%,white)] overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Email Parser</CardTitle>
                  <CardDescription className="text-white/80">
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
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-[color-mix(in_oklab,var(--accent-color)_10%,white)] overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">AI Sourcing Assistant</CardTitle>
                  <CardDescription className="text-white/80">
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
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-[color-mix(in_oklab,var(--accent-color)_10%,white)] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Query History</CardTitle>
                  <CardDescription className="text-white/80">
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
    </div>
  );
}
