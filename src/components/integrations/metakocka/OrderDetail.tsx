/**
 * OrderDetail Component
 * 
 * Displays detailed information about an order with sync status and actions
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import OrderStatusBadge from './OrderStatusBadge';
import FulfillOrderButton from './FulfillOrderButton';
import CancelOrderButton from './CancelOrderButton';
import { syncOrder, getOrderSyncStatus, updateOrderStatus } from '@/lib/integrations/metakocka/order-api';

interface OrderDetailProps {
  orderId: string;
  onRefresh?: () => void;
}

export default function OrderDetail({ orderId, onRefresh }: OrderDetailProps) {
  const [order, setOrder] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch order data and sync status on component mount
  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);
  
  // Fetch order data from the API
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
  
  // Handle order sync
  const handleSyncOrder = async () => {
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
  
  // Handle order status update
  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Order status updated to ${newStatus}`,
        });
        
        // Refresh order data and sync status
        await fetchOrderData();
      } else {
        toast({
          title: 'Error',
          description: `Failed to update order status: ${result.error || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // Handle order fulfillment completion
  const handleFulfillmentComplete = () => {
    fetchOrderData();
    if (onRefresh) onRefresh();
  };
  
  // Handle order cancellation completion
  const handleCancellationComplete = () => {
    fetchOrderData();
    if (onRefresh) onRefresh();
  };
  
  // Determine available status transitions based on current status
  const getAvailableStatusTransitions = () => {
    if (!order) return [];
    
    const currentStatus = order.status;
    
    switch (currentStatus) {
      case 'draft':
        return ['confirmed'];
      case 'confirmed':
        return ['processing', 'on_hold', 'cancelled'];
      case 'processing':
        return ['on_hold', 'partially_fulfilled', 'fulfilled', 'cancelled'];
      case 'partially_fulfilled':
        return ['fulfilled', 'cancelled'];
      case 'on_hold':
        return ['processing', 'cancelled'];
      default:
        return [];
    }
  };
  
  // Check if order can be fulfilled
  const canFulfill = () => {
    if (!order) return false;
    return ['confirmed', 'processing', 'partially_fulfilled'].includes(order.status);
  };
  
  // Check if order can be cancelled
  const canCancel = () => {
    if (!order) return false;
    return !['fulfilled', 'cancelled'].includes(order.status);
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
      <div className="text-center py-12 border rounded-lg">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Order {order.document_number || `#${order.id.substring(0, 8)}`}
        </h1>
        <Button onClick={fetchOrderData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Status:</dt>
                <dd><OrderStatusBadge status={order.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Date:</dt>
                <dd>{formatDate(order.document_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Customer:</dt>
                <dd>{order.customer_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Total Amount:</dt>
                <dd>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(order.total_amount || 0)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle>Metakocka Sync</CardTitle>
          </CardHeader>
          <CardContent>
            {syncStatus ? (
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">Status:</dt>
                  <dd>
                    <span className={syncStatus.sync_status === 'synced' ? 'text-green-500' : 
                                    syncStatus.sync_status === 'error' ? 'text-red-500' : 
                                    'text-yellow-500'}>
                      {syncStatus.sync_status.charAt(0).toUpperCase() + syncStatus.sync_status.slice(1)}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Metakocka ID:</dt>
                  <dd className="truncate max-w-[150px]">{syncStatus.metakocka_id || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Last Synced:</dt>
                  <dd>{syncStatus.last_synced_at ? formatDate(syncStatus.last_synced_at) : 'Never'}</dd>
                </div>
                {syncStatus.sync_error && (
                  <div className="pt-2">
                    <dt className="font-medium text-red-500">Error:</dt>
                    <dd className="text-red-500 text-sm mt-1">{syncStatus.sync_error}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-500">Not synced with Metakocka</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSyncOrder} 
              disabled={isSyncing} 
              className="w-full"
            >
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
              {syncStatus ? 'Sync Again' : 'Sync with Metakocka'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Update */}
              <div>
                <h3 className="text-sm font-medium mb-2">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {getAvailableStatusTransitions().map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(status)}
                      disabled={isUpdatingStatus}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                  {getAvailableStatusTransitions().length === 0 && (
                    <p className="text-sm text-gray-500">No status transitions available</p>
                  )}
                </div>
              </div>
              
              {/* Fulfillment & Cancellation */}
              <div>
                <h3 className="text-sm font-medium mb-2">Order Actions</h3>
                <div className="flex gap-2">
                  {canFulfill() && (
                    <FulfillOrderButton 
                      orderId={orderId} 
                      disabled={!syncStatus || isUpdatingStatus}
                      onFulfillmentComplete={handleFulfillmentComplete}
                    />
                  )}
                  
                  {canCancel() && (
                    <CancelOrderButton 
                      orderId={orderId} 
                      disabled={!syncStatus || isUpdatingStatus}
                      onCancellationComplete={handleCancellationComplete}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(item.unit_price || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(item.total_price || item.quantity * item.unit_price || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">No items in this order</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
