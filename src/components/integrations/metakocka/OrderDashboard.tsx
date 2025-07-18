/**
 * OrderDashboard Component
 * 
 * A comprehensive dashboard for managing orders with Metakocka integration
 */

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { syncOrder, syncMultipleOrders, getBulkOrderSyncStatus } from '@/lib/integrations/metakocka/order-api';
import SyncOrdersFromMetakockaButton from './SyncOrdersFromMetakockaButton';
import OrderList from '@/components/integrations/metakocka/OrderList';
import { EmptyState } from '@/components/ui/empty-state';

interface OrderDashboardProps {
  userId: string;
  status?: string;
}

interface Order {
  id: string;
  document_number?: string;
  customer_name?: string;
  status?: string;
  [key: string]: unknown;
}

export default function OrderDashboard({ status }: OrderDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, unknown>>({});
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(status || null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  
  const { toast } = useToast();
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update activeStatusFilter when status prop changes
  useEffect(() => {
    setActiveStatusFilter(status || null);
  }, [status]);

  // Filter orders based on search query and status filter
  useEffect(() => {
    let filtered = [...orders];
    
    // Apply status filter if active
    if (activeStatusFilter) {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === activeStatusFilter.toLowerCase()
      );
    }
    
    // Apply search query filter
    if (searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        (order.document_number?.toLowerCase() || '').includes(lowercaseQuery) ||
        (order.customer_name?.toLowerCase() || '').includes(lowercaseQuery) ||
        (order.status?.toLowerCase() || '').includes(lowercaseQuery)
      );
    }
    
    setFilteredOrders(filtered);
  }, [searchQuery, orders, activeStatusFilter]);
  
  // Fetch orders from the API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Using userId from props for multi-tenant isolation would be implemented here
      const response = await fetch('/api/sales-documents?type=order');
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
      
      // Calculate order counts by status
      const counts: Record<string, number> = {
        draft: 0,
        confirmed: 0,
        fulfilled: 0,
        cancelled: 0
      };
      
      data.forEach((order: Order) => {
        const status = order.status?.toLowerCase();
        if (status && counts[status] !== undefined) {
          counts[status]++;
        }
      });
      
      setOrderCounts(counts);
      
      // Fetch sync status for all orders
      if (data.length) {
        await fetchSyncStatus(data.map((order: Order) => order.id));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch sync status for orders
  const fetchSyncStatus = async (orderIds: string[]) => {
    try {
      const result = await getBulkOrderSyncStatus(orderIds);
      
      const statusMap: Record<string, unknown> = {};
      if (result.mappings) {
        result.mappings.forEach((mapping: Record<string, unknown>) => {
          const id = (mapping.crmId as string) || (mapping.document_id as string);
          statusMap[id] = mapping;
        });
      }
      
      setSyncStatus(statusMap);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };
  
  // Handle order selection
  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };
  
  // Handle select all orders
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const orderIds = filteredOrders.map(order => order.id);
      setSelectedOrders(orderIds);
    } else {
      setSelectedOrders([]);
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status: string | null) => {
    setActiveStatusFilter(status);
  };
  
  // Sync a single order
  const handleSyncOrder = async (orderId: string) => {
    try {
      setIsSyncing(true);
      
      const result = await syncOrder(orderId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order successfully synced with Metakocka',
        });
        
        // Refresh sync status
        await fetchSyncStatus([orderId]);
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
  
  // Sync multiple orders
  const handleSyncMultiple = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'No Orders Selected',
        description: 'Please select at least one order to sync.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      
      const result = await syncMultipleOrders(selectedOrders);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Successfully synced ${result.created + result.updated} orders with Metakocka`,
        });
        
        // Refresh sync status
        await fetchSyncStatus(selectedOrders);
      } else {
        toast({
          title: 'Warning',
          description: `Synced ${result.created + result.updated} orders, but ${result.failed} failed`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing multiple orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };



  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex space-x-2">
          <SyncOrdersFromMetakockaButton onSyncComplete={fetchOrders} />
          <Button onClick={fetchOrders} variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeStatusFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange(null)}
        >
          All
          <Badge variant="secondary" className="ml-2">{orders.length}</Badge>
        </Button>
        <Button
          variant={activeStatusFilter === "draft" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange("draft")}
        >
          Draft
          <Badge variant="secondary" className="ml-2">{orderCounts.draft || 0}</Badge>
        </Button>
        <Button
          variant={activeStatusFilter === "confirmed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange("confirmed")}
        >
          Confirmed
          <Badge variant="secondary" className="ml-2">{orderCounts.confirmed || 0}</Badge>
        </Button>
        <Button
          variant={activeStatusFilter === "fulfilled" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange("fulfilled")}
        >
          Fulfilled
          <Badge variant="secondary" className="ml-2">{orderCounts.fulfilled || 0}</Badge>
        </Button>
        <Button
          variant={activeStatusFilter === "cancelled" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilterChange("cancelled")}
        >
          Cancelled
          <Badge variant="secondary" className="ml-2">{orderCounts.cancelled || 0}</Badge>
        </Button>
      </div>
      
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button
          onClick={handleSyncMultiple}
          disabled={selectedOrders.length === 0 || isSyncing}
        >
          {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sync Selected ({selectedOrders.length})
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading orders...</span>
        </div>
      ) : filteredOrders.length > 0 ? (
        <OrderList
          orders={filteredOrders}
          syncStatus={syncStatus}
          selectedOrders={selectedOrders}
          onSelectOrder={handleSelectOrder}
          onSelectAll={handleSelectAll}
          onSyncOrder={handleSyncOrder}
          isSyncing={isSyncing}
        />
      ) : (
        <div className="py-12">
          <EmptyState
            title="No orders found"
            description={activeStatusFilter 
              ? `No orders with status "${activeStatusFilter}" found.`
              : "No orders available. Start by creating your first order or syncing from Metakocka."
            }
            action={{
              label: "Refresh Orders",
              onClick: fetchOrders
            }}
          />
        </div>
      )}
    </div>
  );
}
