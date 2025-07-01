'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';

interface SyncInventoryButtonProps {
  onSyncComplete?: (result: any) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SyncInventoryButton({
  onSyncComplete,
  variant = 'outline',
  size = 'default',
  className = '',
}: SyncInventoryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/metakocka/inventory/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to sync inventory');
      }

      toast({
        title: 'Success',
        description: result.message || 'Inventory synced successfully',
        variant: 'default',
      });

      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error('Error syncing inventory:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <Icons.refresh className="mr-2 h-4 w-4" />
          Sync Inventory
        </>
      )}
    </Button>
  );
}
