'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SupplierList from '@/components/suppliers/SupplierList';
import DocumentUploader from '@/components/suppliers/DocumentUploader';
import EmailParser from '@/components/suppliers/EmailParser';
import SupplierAIChat from '@/components/suppliers/SupplierAIChat';
import HistoryViewer from '@/components/suppliers/HistoryViewer';

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState('suppliers');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Supplier Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage suppliers, upload documents, analyze emails, and get AI-powered insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="suppliers">
            👥 Suppliers
          </TabsTrigger>
          <TabsTrigger value="documents">
            📄 Upload Center
          </TabsTrigger>
          <TabsTrigger value="emails">
            📧 Email Parser
          </TabsTrigger>
          <TabsTrigger value="ai">
            🤖 AI Assistant
          </TabsTrigger>
          <TabsTrigger value="history">
            📚 History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Management</CardTitle>
              <CardDescription>
                View, add, edit, and delete suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload Center</CardTitle>
              <CardDescription>
                Upload and manage supplier documents such as offers, CoAs, specifications, and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Email Parser</CardTitle>
              <CardDescription>
                Paste supplier emails to extract and store important information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailParser />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>AI Sourcing Assistant</CardTitle>
              <CardDescription>
                Ask questions about suppliers, products, and get recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierAIChat />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Query History</CardTitle>
              <CardDescription>
                View past AI queries and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryViewer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
