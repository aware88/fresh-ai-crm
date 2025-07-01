/**
 * Component for bulk synchronization of products with Metakocka
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { syncProducts, getProductsSyncStatus } from '@/lib/products/sync-api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BulkProductSyncUIProps {
  productIds: string[];
  onSyncComplete?: (result: { success: boolean; created: number; updated: number; failed: number }) => void;
  className?: string;
}

export function BulkProductSyncUI({
  productIds,
  onSyncComplete,
  className,
}: BulkProductSyncUIProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(productIds.length);
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Load initial sync status
  useEffect(() => {
    if (productIds.length > 0) {
      loadSyncStatus();
    }
  }, [productIds]);

  const loadSyncStatus = async () => {
    try {
      const status = await getProductsSyncStatus(productIds);
      
      // Count synced products
      const syncedProducts = status.mappings.filter(m => m.synced);
      setSyncedCount(syncedProducts.length);
      
      // Create status map
      const statusMap: Record<string, boolean> = {};
      status.mappings.forEach(mapping => {
        statusMap[mapping.productId] = mapping.synced;
      });
      setSyncStatus(statusMap);
      
      // Update progress
      setProgress(syncedProducts.length / productIds.length * 100);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleBulkSync = async () => {
    if (productIds.length === 0) return;
    
    setLoading(true);
    setProgress(0);
    
    try {
      const result = await syncProducts(productIds);
      
      // Update sync status
      await loadSyncStatus();
      
      toast({
        title: 'Products synced',
        description: `Successfully synced ${result.created + result.updated} products with Metakocka`,
        variant: 'success',
      });
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync products with Metakocka',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkSync}
            disabled={loading || productIds.length === 0}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {loading ? "Syncing..." : "Sync with Metakocka"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDetails}
            disabled={productIds.length === 0}
          >
            {showDetails ? "Hide details" : "Show details"}
          </Button>
        </div>
        
        <Badge variant={syncedCount === totalCount ? "success" : "default"}>
          {syncedCount} / {totalCount} synced
        </Badge>
      </div>
      
      {productIds.length > 0 && (
        <Progress value={progress} className="h-2" />
      )}
      
      {showDetails && (
        <div className="mt-4 border rounded-md p-2 max-h-40 overflow-y-auto text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-2">Product ID</th>
                <th className="text-right py-1 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {productIds.map(id => (
                <tr key={id} className="border-t border-dashed">
                  <td className="py-1 px-2 font-mono text-xs truncate" title={id}>
                    {id.substring(0, 8)}...
                  </td>
                  <td className="py-1 px-2 text-right">
                    {syncStatus[id] ? (
                      <Check className="h-4 w-4 text-green-500 inline-block" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 inline-block" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BulkProductSyncUI;
