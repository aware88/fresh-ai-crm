/**
 * Button component for syncing a product with Metakocka
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { syncProduct, getProductSyncStatus } from '@/lib/products/sync-api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncProductButtonProps {
  productId: string;
  initialSyncStatus?: {
    synced: boolean;
    syncStatus?: string;
    lastSyncedAt?: string;
  };
  onSyncComplete?: (success: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SyncProductButton({
  productId,
  initialSyncStatus,
  onSyncComplete,
  variant = 'outline',
  size = 'sm',
  className,
}: SyncProductButtonProps) {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(initialSyncStatus || { synced: false });
  const { toast } = useToast();

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncProduct(productId);
      
      // Get updated sync status
      const status = await getProductSyncStatus(productId);
      setSyncStatus(status);
      
      toast({
        title: 'Product synced',
        description: 'Product successfully synced with Metakocka',
        variant: 'success',
      });
      
      if (onSyncComplete) {
        onSyncComplete(true);
      }
    } catch (error) {
      console.error('Error syncing product:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync product with Metakocka',
        variant: 'destructive',
      });
      
      if (onSyncComplete) {
        onSyncComplete(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine button content based on sync status
  let buttonContent;
  let tooltipContent;

  if (loading) {
    buttonContent = <Loader2 className="h-4 w-4 animate-spin" />;
    tooltipContent = 'Syncing product with Metakocka...';
  } else if (syncStatus.synced && syncStatus.syncStatus === 'synced') {
    buttonContent = <Check className="h-4 w-4" />;
    tooltipContent = `Synced with Metakocka${syncStatus.lastSyncedAt ? ` on ${new Date(syncStatus.lastSyncedAt).toLocaleString()}` : ''}`;
  } else if (syncStatus.synced && syncStatus.syncStatus === 'error') {
    buttonContent = <AlertCircle className="h-4 w-4 text-destructive" />;
    tooltipContent = 'Sync error. Click to retry.';
  } else {
    buttonContent = <RefreshCw className="h-4 w-4" />;
    tooltipContent = 'Sync with Metakocka';
  }

  return (
    <Tooltip content={tooltipContent}>
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={loading}
        className={cn(className)}
        aria-label="Sync product with Metakocka"
      >
        {buttonContent}
      </Button>
    </Tooltip>
  );
}

export default SyncProductButton;
