'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  getBulkSalesDocumentSyncStatus, 
  syncMultipleSalesDocuments 
} from '@/lib/integrations/metakocka/sales-document-sync-api';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';

interface SalesDocument {
  id: string;
  name: string;
  document_number: string;
  date: string;
  total_amount: number;
  status: string;
}

interface SalesDocumentSyncStatus {
  documentId: string;
  synced: boolean;
  lastSyncedAt?: string;
  syncStatus?: string;
  syncError?: string;
  metakockaId?: string;
}

interface SalesDocumentBulkSyncUIProps {
  documents: SalesDocument[];
  onSyncComplete?: () => void;
  className?: string;
}

export function SalesDocumentBulkSyncUI({
  documents,
  onSyncComplete,
  className = '',
}: SalesDocumentBulkSyncUIProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SalesDocumentSyncStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  // Fetch sync statuses for all documents
  useEffect(() => {
    if (documents.length === 0) return;

    const fetchSyncStatuses = async () => {
      setIsLoading(true);
      try {
        const documentIds = documents.map(doc => doc.id);
        const response = await getBulkSalesDocumentSyncStatus(documentIds);
        
        // Convert array of mappings to a record keyed by document ID
        const statusMap: Record<string, SalesDocumentSyncStatus> = {};
        response.mappings.forEach((mapping: SalesDocumentSyncStatus) => {
          statusMap[mapping.documentId] = mapping;
        });
        
        setSyncStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching sync statuses:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch sync statuses',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyncStatuses();
  }, [documents, toast]);

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  // Handle individual document selection
  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
      setSelectAll(false);
    }
  };

  // Handle bulk sync
  const handleBulkSync = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'No documents selected',
        description: 'Please select at least one document to sync',
        variant: 'default',
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 5, 95));
      }, 200);

      // Perform the sync
      const result = await syncMultipleSalesDocuments(selectedDocuments);
      
      // Complete progress
      clearInterval(progressInterval);
      setSyncProgress(100);

      // Show success message
      toast({
        title: 'Sync complete',
        description: `Successfully synced ${result.created + result.updated} documents. Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        variant: result.failed > 0 ? 'destructive' : 'success',
      });

      // Refresh sync statuses after a short delay
      setTimeout(async () => {
        try {
          const response = await getBulkSalesDocumentSyncStatus(selectedDocuments);
          const newSyncStatuses = { ...syncStatuses };
          response.mappings.forEach((mapping: SalesDocumentSyncStatus) => {
            newSyncStatuses[mapping.documentId] = mapping;
          });
          setSyncStatuses(newSyncStatuses);
        } catch (error) {
          console.error('Error refreshing sync statuses:', error);
        }

        // Reset UI state
        setIsSyncing(false);
        setSyncProgress(0);
        
        // Notify parent component
        if (onSyncComplete) {
          onSyncComplete();
        }
      }, 1000);
    } catch (error) {
      console.error('Error syncing documents:', error);
      clearInterval(progressInterval); // Fix: Use progressInterval instead of interval
      setSyncProgress(0);
      setIsSyncing(false);
      
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync documents',
        variant: 'destructive',
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get sync status badge
  const getSyncStatusBadge = (documentId: string) => {
    const status = syncStatuses[documentId];
    
    if (!status) {
      return <Badge variant="outline">Not Synced</Badge>;
    }
    
    if (status.syncStatus === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    if (status.synced) {
      return <Badge variant="success">Synced</Badge>;
    }
    
    return <Badge variant="outline">Not Synced</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sales Documents Sync</CardTitle>
            <CardDescription>
              Select documents to sync with Metakocka
            </CardDescription>
          </div>
          <Button
            onClick={handleBulkSync}
            disabled={selectedDocuments.length === 0 || isSyncing}
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Selected ({selectedDocuments.length})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isSyncing && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Syncing {selectedDocuments.length} documents...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading sync status...</span>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all documents"
                      disabled={isSyncing}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={(checked) => 
                            handleSelectDocument(doc.id, checked === true)
                          }
                          aria-label={`Select document ${doc.document_number}`}
                          disabled={isSyncing}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">
                          #{doc.document_number}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(doc.date)}</TableCell>
                      <TableCell>{formatCurrency(doc.total_amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            doc.status === 'paid' ? 'success' :
                            doc.status === 'pending' ? 'warning' :
                            'outline'
                          }
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSyncStatusBadge(doc.id)}
                          {syncStatuses[doc.id]?.lastSyncedAt && (
                            <Tooltip 
                              content={`Last synced: ${new Date(syncStatuses[doc.id].lastSyncedAt!).toLocaleString()}`}
                            >
                              <div className="cursor-help">
                                {syncStatuses[doc.id].syncStatus === 'error' ? (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
