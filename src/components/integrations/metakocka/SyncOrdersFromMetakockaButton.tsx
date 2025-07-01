/**
 * SyncOrdersFromMetakockaButton Component
 * 
 * Button component for syncing orders from Metakocka to CRM
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { getUnsyncedOrdersFromMetakocka, syncOrdersFromMetakocka } from '@/lib/integrations/metakocka/order-api';
import { RefreshCw } from 'lucide-react';

interface SyncOrdersFromMetakockaButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export default function SyncOrdersFromMetakockaButton({ 
  onSyncComplete, 
  className 
}: SyncOrdersFromMetakockaButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  // Check for unsynced orders
  const checkUnsyncedOrders = async () => {
    try {
      setIsLoading(true);
      const result = await getUnsyncedOrdersFromMetakocka();
      
      if (result.success && result.orders) {
        setUnsyncedCount(result.orders.length);
        
        if (result.orders.length === 0) {
          toast({
            title: 'No unsynced orders',
            description: 'All Metakocka orders are already synced to CRM.',
          });
        }
      }
    } catch (error) {
      console.error('Error checking unsynced orders:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check unsynced orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sync all unsynced orders from Metakocka to CRM
  const syncFromMetakocka = async () => {
    try {
      setIsLoading(true);
      const result = await syncOrdersFromMetakocka();
      
      if (result.success) {
        toast({
          title: 'Sync completed',
          description: `Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        });
        
        // Reset unsynced count
        setUnsyncedCount(0);
        
        // Call the onSyncComplete callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing orders from Metakocka:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync orders from Metakocka',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={className}
            onClick={unsyncedCount === null ? checkUnsyncedOrders : syncFromMetakocka}
            disabled={isLoading}
          >
            <div className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {unsyncedCount === null
                ? 'Check Metakocka Orders'
                : unsyncedCount > 0
                ? `Sync ${unsyncedCount} Orders from Metakocka`
                : 'All Orders Synced'}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {unsyncedCount === null
              ? 'Check for unsynced orders in Metakocka'
              : unsyncedCount > 0
              ? `Sync ${unsyncedCount} unsynced orders from Metakocka to CRM`
              : 'All Metakocka orders are already synced'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
