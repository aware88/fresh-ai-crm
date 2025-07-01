'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { getContactSyncStatus, syncContact } from '@/lib/integrations/metakocka/contact-sync-api';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SyncContactButtonProps {
  contactId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncComplete?: (success: boolean) => void;
}

export function SyncContactButton({
  contactId,
  variant = 'outline',
  size = 'sm',
  className = '',
  onSyncComplete
}: SyncContactButtonProps) {
  const [isSynced, setIsSynced] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltipText, setTooltipText] = useState<string>('Sync to Metakocka');

  // Fetch initial sync status
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const response = await getContactSyncStatus(contactId);
        setIsSynced(response.synced);
        
        if (response.synced && response.mapping) {
          const lastSynced = new Date(response.mapping.lastSyncedAt).toLocaleString();
          setTooltipText(`Last synced: ${lastSynced}`);
          
          if (response.mapping.syncStatus === 'error') {
            setError(response.mapping.syncError || 'Sync error');
            setTooltipText(`Sync error: ${response.mapping.syncError}`);
          }
        }
      } catch (err) {
        console.error('Error fetching sync status:', err);
        setError('Failed to check sync status');
      }
    };

    fetchSyncStatus();
  }, [contactId]);

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await syncContact(contactId);
      setIsSynced(true);
      setTooltipText(`Last synced: ${new Date().toLocaleString()}`);
      if (onSyncComplete) onSyncComplete(true);
    } catch (err) {
      console.error('Error syncing contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync contact');
      setTooltipText(`Sync error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        variant={error ? 'destructive' : variant}
        size={size}
        className={className}
        onClick={handleSync}
        disabled={isLoading}
      >
        {getButtonContent()}
      </Button>
    </Tooltip>
  );
}
