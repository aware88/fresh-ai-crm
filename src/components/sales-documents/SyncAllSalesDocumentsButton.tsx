/**
 * SyncAllSalesDocumentsButton Component
 * Button to sync all sales documents with Metakocka
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Loader2, RefreshCw } from 'lucide-react';
import { syncAllSalesDocuments } from '@/lib/sales-documents/api';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface SyncAllSalesDocumentsButtonProps {
  filters?: {
    documentType?: string;
    status?: string;
  };
  onSyncComplete?: (result: { success: boolean; created: number; updated: number; failed: number }) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SyncAllSalesDocumentsButton({
  filters,
  onSyncComplete,
  variant = 'default',
  size = 'default',
  className = '',
}: SyncAllSalesDocumentsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const { toast } = useToast();

  // Function to sync all sales documents
  const handleSyncAll = async () => {
    setIsLoading(true);
    setShowProgress(true);
    setProgress(10); // Start progress at 10%
    
    try {
      // Simulate progress updates (since the API doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 500);

      const result = await syncAllSalesDocuments(filters);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success) {
        toast({
          title: 'Sync successful',
          description: `Successfully synced ${result.created + result.updated} sales documents. Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
          variant: 'default',
        });
        if (onSyncComplete) {
          onSyncComplete({
            success: true,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
          });
        }
      } else {
        toast({
          title: 'Sync partially failed',
          description: `Some sales documents failed to sync. Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
          variant: 'destructive',
        });
        if (onSyncComplete) {
          onSyncComplete({
            success: false,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
          });
        }
      }
    } catch (error) {
      console.error('Error syncing all sales documents:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'An error occurred while syncing sales documents.',
        variant: 'destructive',
      });
      if (onSyncComplete) {
        onSyncComplete({
          success: false,
          created: 0,
          updated: 0,
          failed: 0,
        });
      }
    } finally {
      setIsLoading(false);
      // Hide progress bar after a delay
      setTimeout(() => {
        setShowProgress(false);
        setProgress(0);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Tooltip content="Sync all sales documents with Metakocka">
        <Button 
          variant={variant} 
          size={size} 
          className={className} 
          onClick={handleSyncAll} 
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
              Sync All
            </>
          )}
        </Button>
      </Tooltip>
      
      {showProgress && (
        <div className="w-full">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {progress < 100 ? 'Syncing documents...' : 'Sync complete!'}
          </p>
        </div>
      )}
    </div>
  );
}

export default SyncAllSalesDocumentsButton;
