/**
 * OrderInventoryAllocation Component
 * 
 * Displays and manages inventory allocations for an order
 */

'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface OrderInventoryAllocationProps {
  orderId: string;
  onUpdate?: () => void;
}

export default function OrderInventoryAllocation({ 
  orderId, 
  onUpdate 
}: OrderInventoryAllocationProps) {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch inventory allocations on component mount
  useEffect(() => {
    if (orderId) {
      fetchInventoryAllocations();
    }
  }, [orderId]);
  
  // Fetch inventory allocations for the order
  const fetchInventoryAllocations = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate some sample data
      const mockAllocations = [
        {
          id: '1',
          product_id: 'prod-1',
          product_name: 'Widget A',
          quantity_allocated: 2,
          quantity_fulfilled: 0,
          warehouse_id: 'wh-1',
          warehouse_name: 'Main Warehouse',
          status: 'allocated',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          product_id: 'prod-2',
          product_name: 'Widget B',
          quantity_allocated: 1,
          quantity_fulfilled: 1,
          warehouse_id: 'wh-1',
          warehouse_name: 'Main Warehouse',
          status: 'fulfilled',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          product_id: 'prod-3',
          product_name: 'Widget C',
          quantity_allocated: 3,
          quantity_fulfilled: 0,
          warehouse_id: 'wh-2',
          warehouse_name: 'Secondary Warehouse',
          status: 'allocated',
          created_at: new Date().toISOString()
        }
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setAllocations(mockAllocations);
        setIsLoading(false);
      }, 500);
      
      // In a real implementation, you would fetch from the API:
      // const response = await fetch(`/api/orders/${orderId}/inventory-allocations`);
      // if (!response.ok) throw new Error('Failed to fetch inventory allocations');
      // const data = await response.json();
      // setAllocations(data.allocations || []);
    } catch (error) {
      console.error('Error fetching inventory allocations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory allocations. Please try again.',
        variant: 'destructive',
      });
      setAllocations([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update inventory allocation status
  const updateAllocationStatus = async (allocationId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate an update
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setAllocations(prev => 
        prev.map(allocation => 
          allocation.id === allocationId 
            ? { ...allocation, status: newStatus } 
            : allocation
        )
      );
      
      toast({
        title: 'Success',
        description: 'Inventory allocation updated successfully',
      });
      
      // Notify parent component if needed
      if (onUpdate) {
        onUpdate();
      }
      
      // In a real implementation, you would update via the API:
      // const response = await fetch(`/api/inventory-allocations/${allocationId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
      // if (!response.ok) throw new Error('Failed to update allocation status');
    } catch (error) {
      console.error('Error updating allocation status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update allocation status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Get status badge for allocation
  const getAllocationStatusBadge = (status: string) => {
    switch (status) {
      case 'allocated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Allocated</Badge>;
      case 'fulfilled':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Fulfilled</Badge>;
      case 'released':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Released</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading inventory allocations...</span>
      </div>
    );
  }
  
  if (allocations.length === 0) {
    return (
      <div className="text-center py-6 border rounded-lg">
        <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No inventory allocations found for this order</p>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Inventory Allocations</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Allocated</TableHead>
            <TableHead className="text-right">Fulfilled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allocations.map((allocation) => (
            <TableRow key={allocation.id}>
              <TableCell>{allocation.product_name}</TableCell>
              <TableCell>{allocation.warehouse_name}</TableCell>
              <TableCell className="text-right">{allocation.quantity_allocated}</TableCell>
              <TableCell className="text-right">{allocation.quantity_fulfilled}</TableCell>
              <TableCell>{getAllocationStatusBadge(allocation.status)}</TableCell>
              <TableCell className="text-right">
                {allocation.status === 'allocated' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAllocationStatus(allocation.id, 'fulfilled')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                    Mark Fulfilled
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
