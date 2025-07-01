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
  const [error, setError] = useState<string | null>(null);
  const [tooltipText, setTooltipText] = useState<string>('Sync to Metakocka');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch initial sync status
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const response = await getSalesDocumentSyncStatus(documentId);
        setIsSynced(response.synced);
        
        if (response.synced && response.mapping) {
          const lastSynced = new Date(response.mapping.lastSyncedAt).toLocaleString();
          setLastSyncTime(lastSynced);
          setTooltipText(`Last synced: ${lastSynced}`);
          
          if (response.mapping.syncStatus === 'error') {
            setError(response.mapping.syncError || 'Sync error');
            setTooltipText(`Sync failed: ${formatErrorMessage(response.mapping.syncError)}`);
          }
        }
      } catch (err) {
        console.error('Error fetching sync status:', err);
        setError('Failed to check sync status');
        setTooltipText('Unable to check sync status');
      }
    };

    fetchSyncStatus();
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
    setIsLoading(true);
    setError(null);
    
    try {
      await syncSalesDocument(documentId);
      const currentTime = new Date().toLocaleString();
      setIsSynced(true);
      setLastSyncTime(currentTime);
      setTooltipText(`Last synced: ${currentTime}`);
      
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
      
      // Show error toast
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onSyncComplete) onSyncComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button appearance based on state
  const getButtonContent = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
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
        disabled={isLoading}
        aria-label={`Sync document to Metakocka${lastSyncTime ? ` (last synced: ${lastSyncTime})` : ''}`}
      >
        {getButtonContent()}
      </Button>
    </Tooltip>
  );
}
