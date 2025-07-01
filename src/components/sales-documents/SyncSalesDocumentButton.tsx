/**
 * SyncSalesDocumentButton Component
 * Button to sync a sales document with Metakocka
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { syncSalesDocument, getSalesDocumentSyncStatus } from '@/lib/sales-documents/api';
import { SalesDocumentMapping, SyncStatus } from '@/types/sales-document';
import { useToast } from '@/components/ui/use-toast';

interface SyncSalesDocumentButtonProps {
  documentId: string;
  onSyncComplete?: (success: boolean) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SyncSalesDocumentButton({
  documentId,
  onSyncComplete,
  variant = 'default',
  size = 'default',
  className = '',
}: SyncSalesDocumentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const { toast } = useToast();

  // Function to fetch the current sync status
  const fetchSyncStatus = async () => {
    try {
      const mapping = await getSalesDocumentSyncStatus(documentId);
      if (mapping) {
        setSyncStatus(mapping.sync_status);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  // Fetch the sync status when the component mounts
  useState(() => {
    fetchSyncStatus();
  });

  // Function to sync the sales document
  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncSalesDocument(documentId);
      
      if (result.success) {
        toast({
          title: 'Sync successful',
          description: 'The sales document has been synced with Metakocka.',
          variant: 'default',
        });
        setSyncStatus('synced');
        if (onSyncComplete) {
          onSyncComplete(true);
        }
      } else {
        toast({
          title: 'Sync failed',
          description: result.error || 'An error occurred while syncing the sales document.',
          variant: 'destructive',
        });
        setSyncStatus('error');
        if (onSyncComplete) {
          onSyncComplete(false);
        }
      }
    } catch (error) {
      console.error('Error syncing sales document:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'An error occurred while syncing the sales document.',
        variant: 'destructive',
      });
      setSyncStatus('error');
      if (onSyncComplete) {
        onSyncComplete(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render different button states based on sync status
  const renderButton = () => {
    if (isLoading) {
      return (
        <Button variant={variant} size={size} className={className} disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </Button>
      );
    }

    switch (syncStatus) {
      case 'synced':
        return (
          <Tooltip content="Document is synced with Metakocka">
            <Button variant="success" size={size} className={className} onClick={handleSync}>
              <Check className="mr-2 h-4 w-4" />
              Synced
            </Button>
          </Tooltip>
        );
      case 'error':
        return (
          <Tooltip content="Last sync attempt failed. Click to try again.">
            <Button variant="destructive" size={size} className={className} onClick={handleSync}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Sync Failed
            </Button>
          </Tooltip>
        );
      case 'pending':
        return (
          <Tooltip content="Sync is pending. Click to check status.">
            <Button variant="secondary" size={size} className={className} onClick={handleSync}>
              <Loader2 className="mr-2 h-4 w-4" />
              Pending
            </Button>
          </Tooltip>
        );
      case 'needs_review':
        return (
          <Tooltip content="Document needs review before syncing.">
            <Button variant="outline" size={size} className={className} onClick={handleSync}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Needs Review
            </Button>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content="Sync this document with Metakocka">
            <Button variant={variant} size={size} className={className} onClick={handleSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync
            </Button>
          </Tooltip>
        );
    }
  };

  return renderButton();
}

export default SyncSalesDocumentButton;
