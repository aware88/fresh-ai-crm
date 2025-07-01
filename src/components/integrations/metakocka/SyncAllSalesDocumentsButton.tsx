'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { syncAllSalesDocuments } from '@/lib/integrations/metakocka/sales-document-sync-api';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SyncAllSalesDocumentsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSyncComplete?: (result: any) => void;
}

export function SyncAllSalesDocumentsButton({
  variant = 'default',
  size = 'default',
  className = '',
  onSyncComplete
}: SyncAllSalesDocumentsButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncAllSalesDocuments();
      
      toast({
        title: 'Sales documents synchronized',
        description: `Successfully synced ${result.created + result.updated} documents. Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
      
      if (onSyncComplete) onSyncComplete(result);
    } catch (err) {
      console.error('Error syncing all sales documents:', err);
      toast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Failed to sync sales documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip content="Sync all sales documents to Metakocka">
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
            Sync All Documents
          </>
        )}
      </Button>
    </Tooltip>
  );
}
