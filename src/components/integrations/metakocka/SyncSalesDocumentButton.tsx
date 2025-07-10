'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { getSalesDocumentSyncStatus, syncSalesDocument } from '@/lib/integrations/metakocka/sales-document-sync-api';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SyncSalesDocumentButtonProps {
  documentId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncComplete?: (success: boolean) => void;
}

export function SyncSalesDocumentButton({
  documentId,
  variant = 'outline',
  size = 'sm',
  className = '',
  onSyncComplete
}: SyncSalesDocumentButtonProps) {
  const [isSynced, setIsSynced] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipText, setTooltipText] = useState<string>('Sync to Metakocka');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [metakockaId, setMetakockaId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch initial sync status
  useEffect(() => {
    const fetchSyncStatus = async () => {
      if (!documentId) return;
      
      setIsCheckingStatus(true);
      try {
        const response = await getSalesDocumentSyncStatus(documentId);
        setIsSynced(response.data?.synced || false);
        
        if (response.data?.synced && response.data?.mapping) {
          const mapping = response.data.mapping;
          setMetakockaId(mapping.metakockaId);
          
          const lastSynced = new Date(mapping.lastSyncedAt).toLocaleString();
          setLastSyncTime(lastSynced);
          setTooltipText(`Last synced: ${lastSynced}\nMetakocka ID: ${mapping.metakockaId}`);
          
          if (mapping.syncStatus === 'error') {
            setError(mapping.syncError || 'Sync error');
            setTooltipText(`Sync failed: ${formatErrorMessage(mapping.syncError)}`);
          }
        } else {
          setTooltipText('Not yet synced to Metakocka');
        }
      } catch (err) {
        console.error('Error fetching sync status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check sync status');
        setTooltipText('Unable to check sync status');
      } finally {
        setIsCheckingStatus(false);
      }
    };

    fetchSyncStatus();
    
    // Set up periodic refresh (every 2 minutes)
    const refreshInterval = setInterval(fetchSyncStatus, 120000);
    
    return () => clearInterval(refreshInterval);
  }, [documentId]);
  
  // Format error messages to be more user-friendly
  const formatErrorMessage = (error: string | null | undefined): string => {
    if (!error) return 'Unknown error';
    
    // Truncate long error messages
    if (error.length > 50) {
      return error.substring(0, 47) + '...';
    }
    
    return error;
  };

  const handleSync = async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await syncSalesDocument(documentId);
      const currentTime = new Date().toLocaleString();
      setIsSynced(true);
      setLastSyncTime(currentTime);
      
      // Store the Metakocka ID from the response
      if (result.data?.metakockaId) {
        setMetakockaId(result.data.metakockaId);
        setTooltipText(`Last synced: ${currentTime}\nMetakocka ID: ${result.data.metakockaId}`);
      } else {
        setTooltipText(`Last synced: ${currentTime}`);
      }
      
      // Show success toast
      toast({
        title: "Document synced",
        description: "Sales document successfully synced to Metakocka",
        variant: "success",
      });
      
      if (onSyncComplete) onSyncComplete(true);
    } catch (err) {
      console.error('Error syncing document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync document';
      setError(errorMessage);
      setTooltipText(`Sync failed: ${formatErrorMessage(errorMessage)}`);
      setIsSynced(false);
      
      // Show error toast with retry button
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
        action: <Button size="sm" variant="outline" onClick={handleSync}>Retry</Button>
      });
      
      if (onSyncComplete) onSyncComplete(false);
    } finally {
      setIsLoading(false);
      
      // Refresh sync status after a short delay
      setTimeout(async () => {
        try {
          const response = await getSalesDocumentSyncStatus(documentId);
          setIsSynced(response.data?.synced || false);
          if (response.data?.mapping?.metakockaId) {
            setMetakockaId(response.data.mapping.metakockaId);
          }
        } catch (err) {
          console.error('Error refreshing sync status:', err);
        }
      }, 2000);
    }
  };

  // Determine button appearance based on state
  const getButtonContent = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (isCheckingStatus) {
      return <Loader2 className="h-4 w-4 animate-spin opacity-50" />;
    }
    
    if (error) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    
    if (isSynced) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <RefreshCw className="h-4 w-4" />;
  };

  return (
    <Tooltip content={tooltipText}>
      <Button
        variant={error ? 'destructive' : isSynced ? 'success' : variant}
        size={size}
        className={`${className} ${isSynced && !error ? 'hover:bg-green-600/90' : ''}`}
        onClick={handleSync}
        disabled={isLoading || isCheckingStatus}
        aria-label={`Sync document to Metakocka${lastSyncTime ? ` (last synced: ${lastSyncTime})` : ''}`}
        title={metakockaId ? `Metakocka ID: ${metakockaId}` : undefined}
      >
        {getButtonContent()}
      </Button>
    </Tooltip>
  );
}
