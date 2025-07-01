'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { getUnsyncedSalesDocumentsFromMetakocka, syncSalesDocumentsFromMetakocka } from '@/lib/integrations/metakocka/sales-document-sync-api';
import { RefreshCw } from 'lucide-react';

interface SyncFromMetakockaButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

/**
 * Button component for syncing sales documents from Metakocka to CRM
 */
export function SyncFromMetakockaButton({ onSyncComplete, className }: SyncFromMetakockaButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState<number | null>(null);

  // Check for unsynced documents
  const checkUnsyncedDocuments = async () => {
    try {
      setIsLoading(true);
      const result = await getUnsyncedSalesDocumentsFromMetakocka();
      if (result.success && result.documents) {
        setUnsyncedCount(result.documents.length);
        if (result.documents.length === 0) {
          toast({
            title: 'No unsynced documents',
            description: 'All Metakocka documents are already synced to CRM.',
          });
        }
      }
    } catch (error) {
      console.error('Error checking unsynced documents:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check unsynced documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync all unsynced documents from Metakocka to CRM
  const syncFromMetakocka = async () => {
    try {
      setIsLoading(true);
      const result = await syncSalesDocumentsFromMetakocka();
      
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
          description: result.errors?.[0]?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing from Metakocka:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync from Metakocka',
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
          <div className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              className={className}
              onClick={unsyncedCount === null ? checkUnsyncedDocuments : syncFromMetakocka}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {unsyncedCount === null
                ? 'Check Metakocka'
                : unsyncedCount > 0
                ? `Sync ${unsyncedCount} from Metakocka`
                : 'All synced'}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {unsyncedCount === null
              ? 'Check for unsynced documents in Metakocka'
              : unsyncedCount > 0
              ? `Sync ${unsyncedCount} unsynced documents from Metakocka to CRM`
              : 'All Metakocka documents are already synced'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
