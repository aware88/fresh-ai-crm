/**
 * Orders Page
 * 
 * Main page for order management in the Fresh AI CRM
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import OrderDashboard from '@/components/integrations/metakocka/OrderDashboard';

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to access the orders page.',
        variant: 'destructive',
      });
    }
  }, [status]);
  
  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Show authentication required message if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access the orders page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <OrderDashboard userId={session?.user?.id || ''} />
        </TabsContent>
        
        <TabsContent value="draft">
          <OrderDashboard userId={session?.user?.id || ''} status="draft" />
        </TabsContent>
        
        <TabsContent value="confirmed">
          <OrderDashboard userId={session?.user?.id || ''} status="confirmed" />
        </TabsContent>
        
        <TabsContent value="fulfilled">
          <OrderDashboard userId={session?.user?.id || ''} status="fulfilled" />
        </TabsContent>
        
        <TabsContent value="cancelled">
          <OrderDashboard userId={session?.user?.id || ''} status="cancelled" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
