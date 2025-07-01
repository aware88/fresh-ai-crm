'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncSalesDocumentButton } from './SyncSalesDocumentButton';
import { SyncAllSalesDocumentsButton } from './SyncAllSalesDocumentsButton';
import { Badge } from '@/components/ui/badge';
import { getSalesDocumentSyncStatus } from '@/lib/integrations/metakocka/sales-document-sync-api';
import { Loader2 } from 'lucide-react';

interface SalesDocumentSyncSectionProps {
  documentId?: string;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * A reusable component that provides sales document synchronization functionality.
 * Can be used in both detail views (with documentId) and list views (without documentId).
 */
export function SalesDocumentSyncSection({
  documentId,
  title = 'Metakocka Integration',
  description = 'Sync this sales document with Metakocka ERP',
  className = '',
}: SalesDocumentSyncSectionProps) {
  const [syncStatus, setSyncStatus] = useState<{
    synced: boolean;
    lastSyncedAt?: string;
    syncStatus?: string;
    syncError?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sync status if documentId is provided
  useEffect(() => {
    if (!documentId) return;

    const fetchSyncStatus = async () => {
      setIsLoading(true);
      try {
        const response = await getSalesDocumentSyncStatus(documentId);
        setSyncStatus(response);
      } catch (error) {
        console.error('Error fetching sync status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyncStatus();
  }, [documentId]);

  // Handle sync completion
  const handleSyncComplete = (success: boolean) => {
    if (success && documentId) {
      // Refresh sync status after successful sync
      getSalesDocumentSyncStatus(documentId)
        .then(response => setSyncStatus(response))
        .catch(error => console.error('Error refreshing sync status:', error));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {documentId ? (
            <SyncSalesDocumentButton 
              documentId={documentId} 
              onSyncComplete={handleSyncComplete}
            />
          ) : (
            <SyncAllSalesDocumentsButton />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documentId && (
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Checking sync status...</span>
              </div>
            ) : syncStatus ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  {syncStatus.synced ? (
                    <Badge variant="success">Synced</Badge>
                  ) : (
                    <Badge variant="outline">Not Synced</Badge>
                  )}
                </div>
                
                {syncStatus.synced && syncStatus.lastSyncedAt && (
                  <div>
                    <span className="font-medium">Last synced:</span>{' '}
                    {new Date(syncStatus.lastSyncedAt).toLocaleString()}
                  </div>
                )}
                
                {syncStatus.syncStatus === 'error' && syncStatus.syncError && (
                  <div>
                    <span className="font-medium text-destructive">Error:</span>{' '}
                    <span className="text-destructive">{syncStatus.syncError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>No sync information available.</div>
            )}
          </div>
        )}
        {!documentId && (
          <div className="text-sm text-muted-foreground">
            Use the button above to sync all sales documents with Metakocka.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
