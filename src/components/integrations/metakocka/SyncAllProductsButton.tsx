'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { syncProducts } from '@/lib/products/sync-api';
import { ProductSyncResult } from '@/types/product';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';

interface SyncAllProductsButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg';
  onSyncComplete?: (success: boolean) => void;
  className?: string;
}

export function SyncAllProductsButton({
  variant = 'default',
  size = 'default',
  onSyncComplete,
  className,
}: SyncAllProductsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
    lastSyncedAt?: string;
  } | null>(null);
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('idle');
      setSyncResult(null);
      setSyncProgress(0);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          // Don't go to 100% until we're actually done
          if (prev < 90) {
            return prev + Math.random() * 5;
          }
          return prev;
        });
      }, 300);
      
      // Call the API with empty array to sync all products
      const result = await syncProducts([]);
      
      // Clear the progress interval
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      setSyncResult({
        created: result.created,
        updated: result.updated,
        failed: result.failed,
        errors: result.errors ? result.errors.map(err => ({
          productId: err.product_id || 'unknown',
          error: err.message
        })) : [],
        lastSyncedAt: new Date().toISOString(),
      });
      
      // Consider sync successful if there are no failures or fewer failures than successes
      if (result.failed === 0 || (result.created + result.updated > result.failed)) {
        setSyncStatus('success');
        toast({
          title: "Sync successful",
          description: `${result.created} products created, ${result.updated} products updated in Metakocka.`,
          variant: "default",
        });
        
        if (onSyncComplete) {
          onSyncComplete(true);
        }
      } else {
        setSyncStatus('error');
        toast({
          title: "Sync partially failed",
          description: `${result.created + result.updated} products synced, ${result.failed} products failed.`,
          variant: "destructive",
        });
        
        if (onSyncComplete) {
          onSyncComplete(result.created + result.updated > 0);
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
      return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    }
    
    switch (syncStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 mr-2" />;
    }
  };
  
  // Generate tooltip content for the button
  const getTooltipContent = () => {
    if (isSyncing) {
      return "Syncing all products with Metakocka...";
    }
    
    if (syncResult?.lastSyncedAt) {
      const lastSyncTime = new Date(syncResult.lastSyncedAt).toLocaleString();
      return `Last bulk sync: ${lastSyncTime}`;
    }
    
    return "Sync all products with Metakocka";
  };
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Tooltip content={getTooltipContent()}>
          <Button 
            variant={syncStatus === 'success' ? 'success' : variant} 
            size={size}
            className={className}
          >
            {getIcon()}
            Sync All Products
          </Button>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sync All Products with Metakocka</DialogTitle>
          <DialogDescription>
            This will synchronize all your products with Metakocka. New products will be created, and existing products will be updated.
          </DialogDescription>
        </DialogHeader>
        
        {isSyncing && (
          <div className="py-4">
            <p className="text-sm mb-2">Syncing products with Metakocka...</p>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}
        
        {syncResult && !isSyncing && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span>Created:</span>
              <span className="font-medium">{syncResult.created}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Updated:</span>
              <span className="font-medium">{syncResult.updated}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Failed:</span>
              <span className="font-medium text-red-500">{syncResult.failed}</span>
            </div>
            
            {syncResult.failed > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Errors:</h4>
                <div className="max-h-32 overflow-y-auto text-sm border rounded p-2">
                  {syncResult.errors.map((error, index) => (
                    <div key={index} className="mb-1">
                      <span className="font-medium">{error.productId}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant={isSyncing ? 'outline' : 'default'}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
