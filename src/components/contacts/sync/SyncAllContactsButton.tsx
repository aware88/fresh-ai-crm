/**
 * Button component for syncing all contacts with Metakocka
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { syncContactsToMetakocka, getAllContactSyncStatus } from '@/lib/integrations/metakocka/contact-sync-api';
import { useToast } from '@/components/ui/use-toast';

interface SyncAllContactsButtonProps {
  onSync?: (success: boolean) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SyncAllContactsButton({
  onSync,
  variant = 'secondary',
  size = 'sm',
  className = '',
}: SyncAllContactsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStats, setSyncStats] = useState<{ total: number; synced: number } | null>(null);
  const { toast } = useToast();

  // Check sync status on mount
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const status = await getAllContactSyncStatus();
        setSyncStats({
          total: status.total || 0,
          synced: status.synced || 0,
        });
      } catch (error) {
        console.error('Error checking contacts sync status:', error);
      }
    };
    
    checkSyncStatus();
  }, []);

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncContactsToMetakocka();
      
      if (result.success) {
        toast({
          title: 'Contacts synced',
          description: `Successfully synced ${result.created + result.updated} contacts to Metakocka`,
        });
        
        // Update sync stats
        setSyncStats(prev => ({
          total: prev?.total || 0,
          synced: (prev?.synced || 0) + result.created + result.updated,
        }));
        
        onSync?.(true);
      } else {
        toast({
          title: 'Sync partially failed',
          description: `${result.created + result.updated} contacts synced, ${result.failed} failed`,
          variant: 'destructive',
        });
        onSync?.(false);
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync contacts to Metakocka',
        variant: 'destructive',
      });
      onSync?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync All to Metakocka
          {syncStats && (
            <span className="ml-2 text-xs opacity-70">
              ({syncStats.synced}/{syncStats.total})
            </span>
          )}
        </>
      )}
    </Button>
  );
}
