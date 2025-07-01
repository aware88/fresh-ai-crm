/**
 * OrderDetailPage Component
 * 
 * A comprehensive page component for displaying and managing order details
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, RefreshCw, Package, FileText, History, Settings } from 'lucide-react';
import OrderDetail from './OrderDetail';
import OrderInventoryAllocation from './OrderInventoryAllocation';
import { getOrderSyncStatus, syncOrder } from '@/lib/integrations/metakocka/order-api';

interface OrderDetailPageProps {
  orderId: string;
  userId: string;
}

export default function OrderDetailPage({ orderId, userId }: OrderDetailPageProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Fetch order data on component mount
  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);
  
  // Fetch order data and sync status
  const fetchOrderData = async () => {
    setIsLoading(true);
    try {
      // Fetch order details
      const response = await fetch(`/api/sales-documents/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      
      const data = await response.json();
      setOrder(data);
      
      // Fetch sync status
      await fetchSyncStatus();
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch order details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch sync status for the order
  const fetchSyncStatus = async () => {
    try {
      const result = await getOrderSyncStatus(orderId);
      setSyncStatus(result.mapping);
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setSyncStatus(null);
    }
  };
  
  // Handle sync with Metakocka
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncOrder(orderId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order synced successfully with Metakocka',
        });
        
        // Refresh sync status
        await fetchSyncStatus();
      } else {
        toast({
          title: 'Error',
          description: `Failed to sync order: ${result.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing order:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Navigate back to orders list
  const handleBackToOrders = () => {
    router.push('/orders');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading order details...</span>
      </div>
    );
  }
  
  if (!order) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-gray-500">Order not found</p>
            <Button onClick={handleBackToOrders} variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBackToOrders}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            Order {order.document_number || `#${orderId.substring(0, 8)}`}
          </h1>
        </div>
        
        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          variant="outline"
        >
          {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync with Metakocka
        </Button>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="fulfillment">
            <Package className="h-4 w-4 mr-2" />
            Fulfillment
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <OrderDetail 
            orderId={orderId} 
            onRefresh={fetchOrderData} 
          />
        </TabsContent>
        
        <TabsContent value="fulfillment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Fulfillment</CardTitle>
              <CardDescription>
                Manage the fulfillment process for this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderInventoryAllocation 
                orderId={orderId} 
                onUpdate={fetchOrderData} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                View the complete history of this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Order history will be displayed here.</p>
              {/* Order history component will be added here */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Settings</CardTitle>
              <CardDescription>
                Configure settings for this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Order settings will be displayed here.</p>
              {/* Order settings component will be added here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
