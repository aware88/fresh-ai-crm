'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import OutlookClient from '@/components/email/outlook/OutlookClient';
import { FaEnvelope, FaRobot, FaSearch, FaSync, FaCog } from 'react-icons/fa';
import Link from 'next/link';

export default function EmailPage() {
  const { data: session, status } = useSession();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Check if Outlook is connected
  useEffect(() => {
    async function checkConnection() {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/settings/email/status');
          const data = await response.json();
          
          if (data.success) {
            setConnected(data.connected);
          } else {
            setError(data.error || 'Failed to check connection status');
          }
        } catch (err) {
          console.error('Error checking email connection:', err);
          setError('Failed to check connection status');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    checkConnection();
  }, [status, session]);

  // Handle AI analysis of an email
  const handleAnalyzeEmail = (emailId: string) => {
    console.log('Analyzing email:', emailId);
    // This would be implemented to call the email analysis API
  };

  // Handle AI sales agent functionality
  const handleSalesAgent = (emailId: string) => {
    console.log('Sales agent processing email:', emailId);
    // This would be implemented to call the AI sales agent API
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground">
            Access and manage your emails directly within CRM Mind
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FaEnvelope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Connect your email account</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You need to connect your Outlook account to use the email features.
              </p>
              <Link href="/settings/email">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Go to Email Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground">
            Access and manage your emails directly within CRM Mind
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/settings/email">
            <Button variant="outline" size="sm">
              <FaCog className="mr-2" /> Email Settings
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="inbox" className="px-4 py-2">
              <FaEnvelope className="mr-2" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="ai" className="px-4 py-2">
              <FaRobot className="mr-2" /> AI Assistant
            </TabsTrigger>
            <TabsTrigger value="search" className="px-4 py-2">
              <FaSearch className="mr-2" /> Search
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="inbox" className="mt-0">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="relative">
                <OutlookClient 
                  onAnalyzeEmail={handleAnalyzeEmail}
                  onSalesAgent={handleSalesAgent}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai" className="mt-0">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">AI Email Assistant</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>The AI assistant can help you with:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Analyzing email content and sentiment</li>
                  <li>Finding contact information in emails</li>
                  <li>Suggesting responses based on email context</li>
                  <li>Categorizing emails by priority and type</li>
                  <li>Extracting action items and follow-ups</li>
                </ul>
                
                <div className="mt-6">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <FaRobot className="mr-2" /> Start AI Assistant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search" className="mt-0">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Search Emails</h2>
            </CardHeader>
            <CardContent>
              <p>Advanced email search coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
