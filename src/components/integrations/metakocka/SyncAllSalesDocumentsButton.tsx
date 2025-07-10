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
  const [progress, setProgress] = useState<{total: number; synced: number; failed: number} | null>(null);
  const { toast } = useToast();
  
  // Reset progress when component unmounts or when sync completes
  useEffect(() => {
    return () => {
      setProgress(null);
    };
  }, []);

  const handleSync = async () => {
    setIsLoading(true);
    setProgress(null);
    
    // Show initial toast with loading state
    const syncToastId = toast({
      title: 'Syncing sales documents',
      description: 'Starting synchronization with Metakocka...',
      duration: 60000, // Long duration as we'll update or dismiss it
    });
    
    try {
      // Start the sync process
      const result = await syncAllSalesDocuments();
      
      // Update progress state
      setProgress({
        total: result.total || (result.created + result.updated + result.failed),
        synced: result.created + result.updated,
        failed: result.failed
      });
      
      // Show appropriate toast based on result
      toast.dismiss(syncToastId);
      if (result.failed === 0) {
        toast({
          title: 'Sales documents synchronized',
          description: `Successfully synced ${result.created + result.updated} documents. Created: ${result.created}, Updated: ${result.updated}`,
          variant: 'success',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Sync completed with issues',
          description: `Synced: ${result.created + result.updated}, Failed: ${result.failed}. Check logs for details.`,
          variant: 'warning',
          duration: 8000,
          action: <Button size="sm" variant="outline" onClick={handleSync}>Retry</Button>
        });
      }
      
      if (onSyncComplete) onSyncComplete(result);
    } catch (err) {
      console.error('Error syncing all sales documents:', err);
      
      // Dismiss the loading toast and show error
      toast.dismiss(syncToastId);
      toast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Failed to sync sales documents',
        variant: 'destructive',
        duration: 8000,
        action: <Button size="sm" variant="outline" onClick={handleSync}>Retry</Button>
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render progress information if available
  const renderProgressInfo = () => {
    if (!progress) return null;
    
    const { total, synced, failed } = progress;
    const percentage = total > 0 ? Math.round((synced / total) * 100) : 0;
    
    return (
      <div className="text-xs text-muted-foreground mt-1">
        <div className="flex justify-between mb-1">
          <span>{percentage}% complete</span>
          <span>{synced}/{total} synced</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${failed > 0 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {failed > 0 && (
          <div className="text-destructive mt-0.5">{failed} failed</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <Tooltip content={isLoading ? "Sync in progress..." : "Sync all sales documents to Metakocka"}>
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
      {isLoading && renderProgressInfo()}
    </div>
  );
}
