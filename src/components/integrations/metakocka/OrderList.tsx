/**
 * OrderList Component
 * 
 * Displays a list of orders with sync status and actions
 */

'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { formatDate } from '@/lib/utils';

interface OrderListProps {
  orders: any[];
  syncStatus: Record<string, any>;
  selectedOrders: string[];
  onSelectOrder: (orderId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onSyncOrder: (orderId: string) => Promise<void>;
  isSyncing: boolean;
}

export default function OrderList({
  orders,
  syncStatus,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onSyncOrder,
  isSyncing
}: OrderListProps) {
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  
  // Check if all orders are selected
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  
  // Handle individual order sync
  const handleSyncOrder = async (orderId: string) => {
    setSyncingOrderId(orderId);
    await onSyncOrder(orderId);
    setSyncingOrderId(null);
  };
  
  // Get sync status label
  const getSyncStatusLabel = (orderId: string) => {
    const mapping = syncStatus[orderId];
    
    if (!mapping) return 'Not synced';
    
    if (mapping.sync_status === 'error') {
      return `Error: ${mapping.sync_error || 'Unknown error'}`;
    }
    
    return mapping.sync_status === 'synced' ? 'Synced' : 'Pending';
  };
  
  // Get sync status class
  const getSyncStatusClass = (orderId: string) => {
    const mapping = syncStatus[orderId];
    
    if (!mapping) return 'text-gray-500';
    
    if (mapping.sync_status === 'error') {
      return 'text-red-500';
    }
    
    return mapping.sync_status === 'synced' ? 'text-green-500' : 'text-yellow-500';
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            const isSyncingThis = syncingOrderId === order.id;
            
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectOrder(order.id, !!checked)}
                  />
                </TableCell>
                <TableCell>{order.document_number || '-'}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{formatDate(order.document_date)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(order.total_amount || 0)}
                </TableCell>
                <TableCell>
                  <span className={getSyncStatusClass(order.id)}>
                    {getSyncStatusLabel(order.id)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncOrder(order.id)}
                    disabled={isSyncingThis || isSyncing}
                  >
                    {isSyncingThis ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-3 w-3" />
                    )}
                    Sync
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
