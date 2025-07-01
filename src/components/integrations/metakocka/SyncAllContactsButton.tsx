'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { syncAllContacts } from '@/lib/integrations/metakocka/contact-sync-api';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SyncAllContactsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSyncComplete?: (result: any) => void;
}

export function SyncAllContactsButton({
  variant = 'default',
  size = 'default',
  className = '',
  onSyncComplete
}: SyncAllContactsButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncAllContacts();
      
      toast({
        title: 'Contacts synchronized',
        description: `Successfully synced ${result.created + result.updated} contacts. Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
      
      if (onSyncComplete) onSyncComplete(result);
    } catch (err) {
      console.error('Error syncing all contacts:', err);
      toast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Failed to sync contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip content="Sync all contacts to Metakocka">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleSync}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All Contacts
          </>
        )}
      </Button>
    </Tooltip>
  );
}
