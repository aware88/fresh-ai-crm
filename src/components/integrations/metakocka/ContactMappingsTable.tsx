'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { getAllContactSyncStatus } from '@/lib/integrations/metakocka/contact-sync-api';
import { formatDistanceToNow } from 'date-fns';
import { SyncContactButton } from './SyncContactButton';

interface ContactMapping {
  id: string;
  contactId: string;
  metakockaId: string;
  metakockaCode: string;
  lastSyncedAt: string;
  syncStatus: string;
  syncError: string | null;
  contact: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
}

export function ContactMappingsTable() {
  const [mappings, setMappings] = useState<ContactMapping[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getAllContactSyncStatus();
      if (response.success && response.mappings) {
        setMappings(response.mappings);
      } else {
        setError('Failed to load contact mappings');
      }
    } catch (err) {
      console.error('Error fetching contact mappings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact mappings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleRefresh = () => {
    fetchMappings();
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="success">Synced</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading && mappings.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && mappings.length === 0) {
    return (
      <div className="flex flex-col items-center p-8 gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contact Mappings</h3>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {mappings.length === 0 ? (
        <p className="text-center text-muted-foreground p-4">No contact mappings found</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Metakocka Code</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div className="font-medium">{mapping.contact.name}</div>
                    {mapping.contact.company && (
                      <div className="text-sm text-muted-foreground">{mapping.contact.company}</div>
                    )}
                    {mapping.contact.email && (
                      <div className="text-sm text-muted-foreground">{mapping.contact.email}</div>
                    )}
                  </TableCell>
                  <TableCell>{mapping.metakockaCode}</TableCell>
                  <TableCell>
                    {mapping.lastSyncedAt ? (
                      <span title={new Date(mapping.lastSyncedAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(mapping.lastSyncedAt), { addSuffix: true })}
                      </span>
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell>
                    {getSyncStatusBadge(mapping.syncStatus)}
                    {mapping.syncError && (
                      <div className="text-xs text-destructive mt-1">{mapping.syncError}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <SyncContactButton 
                        contactId={mapping.contactId} 
                        size="icon"
                        onSyncComplete={() => fetchMappings()}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost"
                        asChild
                      >
                        <a 
                          href={`/contacts/${mapping.contactId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
