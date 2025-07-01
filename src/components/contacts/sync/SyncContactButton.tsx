/**
 * Button component for syncing a single contact with Metakocka
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, RefreshCw } from 'lucide-react';
import { syncContactToMetakocka, getContactSyncStatus } from '@/lib/integrations/metakocka/contact-sync-api';
import { useToast } from '@/components/ui/use-toast';

interface SyncContactButtonProps {
  contactId: string;
  onSync?: (success: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SyncContactButton({
  contactId,
  onSync,
  variant = 'outline',
  size = 'icon',
  className = '',
}: SyncContactButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check sync status on mount
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const status = await getContactSyncStatus(contactId);
        setIsSynced(status.synced);
      } catch (error) {
        console.error('Error checking contact sync status:', error);
        setIsSynced(false);
      }
    };
    
    checkSyncStatus();
  }, [contactId]);

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncContactToMetakocka(contactId);
      
      if (result.success) {
        toast({
          title: 'Contact synced',
          description: 'Contact was successfully synced to Metakocka',
        });
        setIsSynced(true);
        onSync?.(true);
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'Failed to sync contact to Metakocka',
          variant: 'destructive',
        });
        onSync?.(false);
      }
    } catch (error) {
      console.error('Error syncing contact:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync contact to Metakocka',
        variant: 'destructive',
      });
      onSync?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={isLoading}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className={`h-4 w-4 ${isSynced ? 'text-green-500' : ''}`} />
            )}
            <span className="sr-only">
              {isSynced ? 'Sync again' : 'Sync to Metakocka'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isSynced ? 'Sync again to Metakocka' : 'Sync to Metakocka'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
