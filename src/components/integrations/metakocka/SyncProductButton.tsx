'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { syncProductWithMetakocka, getProductSyncStatus, ProductSyncStatusResult } from '@/lib/integrations/metakocka/product-sync-api';
import { toast } from '@/components/ui/use-toast';
import { Tooltip } from '@/components/ui/tooltip';

interface SyncProductButtonProps {
  productId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSyncComplete?: (success: boolean) => void;
  className?: string;
}

export function SyncProductButton({
  productId,
  variant = 'outline',
  size = 'sm',
  onSyncComplete,
  className,
}: SyncProductButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncDetails, setSyncDetails] = useState<ProductSyncStatusResult | null>(null);
  
  // Load initial sync status
  useEffect(() => {
    loadSyncStatus();
  }, [productId]);
  
  const loadSyncStatus = async () => {
    try {
      const status = await getProductSyncStatus(productId);
      setSyncDetails(status);
      
      if (status.synced) {
        if (status.syncStatus === 'error') {
          setSyncStatus('error');
        } else {
          setSyncStatus('success');
        }
      } else {
        setSyncStatus('idle');
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      const result = await syncProductWithMetakocka(productId);
      
      if (result.success) {
        // Refresh sync status to get latest details
        await loadSyncStatus();
        
        toast({
          title: "Sync successful",
          description: "Product has been synchronized with Metakocka.",
          variant: "default",
        });
        
        if (onSyncComplete) {
          onSyncComplete(true);
        }
      } else {
        setSyncStatus('error');
        toast({
          title: "Sync failed",
          description: result.error || "Failed to sync product with Metakocka.",
          variant: "destructive",
        });
        
        if (onSyncComplete) {
          onSyncComplete(false);
        }
      }
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      
      if (onSyncComplete) {
        onSyncComplete(false);
      }
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Determine icon based on sync status
  const getIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (syncDetails?.synced) {
      if (syncDetails.syncStatus === 'error') {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      }
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <RefreshCw className="h-4 w-4" />;
  };
  
  // Generate tooltip content
  const getTooltipContent = () => {
    if (isSyncing) {
      return "Syncing product with Metakocka...";
    }
    
    if (syncDetails?.synced) {
      if (syncDetails.syncStatus === 'error') {
        return `Sync error: ${syncDetails.syncError || 'Unknown error'}`;
      }
      
      const lastSyncTime = syncDetails.lastSyncedAt 
        ? new Date(syncDetails.lastSyncedAt).toLocaleString() 
        : 'Unknown';
        
      return `Last synced: ${lastSyncTime}`;
    }
    
    return "Sync product with Metakocka";
  };
  
  // Determine if button should show as icon-only
  const isIconOnly = size === 'icon';
  
  return (
    <Tooltip content={getTooltipContent()}>
      <Button
        variant={syncDetails?.synced && syncDetails.syncStatus !== 'error' ? 'success' : variant}
        size={size}
        onClick={handleSync}
        disabled={isSyncing}
        className={className}
      >
        {getIcon()}
        {!isIconOnly && (
          <span className="ml-2">
            {isSyncing ? 'Syncing...' : 'Sync'}
          </span>
        )}
      </Button>
    </Tooltip>
  );
}
