'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

interface SyncEmailAnalyticsButtonProps {
  organizationId?: string;
  onDataCreated?: () => void;
}

export default function SyncEmailAnalyticsButton({
  organizationId, 
  onDataCreated 
}: SyncEmailAnalyticsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();

  const syncRealEmails = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/email/followups/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        setLastSyncTime(result.syncedAt);
        toast({
          title: 'Email Analytics Synced',
          description: `${result.message}. Last synced: ${new Date(result.syncedAt).toLocaleString()}`,
        });
        onDataCreated?.();
      } else {
        throw new Error(result.error || 'Failed to sync email analytics');
      }
    } catch (error) {
      console.error('Error syncing email analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync email analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Load last sync time on component mount
  React.useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const response = await fetch('/api/email/accounts');
        if (response.ok) {
          const data = await response.json();
          const account = data.accounts?.[0];
          if (account?.last_followup_sync_at) {
            setLastSyncTime(account.last_followup_sync_at);
          }
        }
      } catch (error) {
        console.error('Error loading last sync time:', error);
      }
    };
    
    loadLastSyncTime();
  }, []);

  return (
    <div className="space-y-2">
      <Button
        onClick={syncRealEmails}
        disabled={isSyncing}
        size="sm"
        variant="default"
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Email Analytics
      </Button>
      
      {lastSyncTime && (
        <div className="text-xs text-muted-foreground">
          Last synced: {new Date(lastSyncTime).toLocaleString()}
        </div>
      )}
      
      {!lastSyncTime && (
        <div className="text-xs text-muted-foreground italic">
          Never synced
        </div>
      )}
    </div>
  );
}
