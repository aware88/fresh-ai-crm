'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactMappingsTable } from '@/components/integrations/metakocka/ContactMappingsTable';

import { getUnsyncedPartnersFromMetakocka } from '@/lib/integrations/metakocka/contact-sync-api';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UnsyncedPartner {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  type: string;
}

export default function MetakockaContactsPage() {
  const [activeTab, setActiveTab] = useState<string>('mappings');
  const [unsyncedPartners, setUnsyncedPartners] = useState<UnsyncedPartner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingIndividual, setSyncingIndividual] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnsyncedPartners = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getUnsyncedPartnersFromMetakocka();
      if (response && response.partners) {
        setUnsyncedPartners(response.partners);
      } else {
        setError('Failed to load unsynced partners');
      }
    } catch (err) {
      console.error('Error fetching unsynced partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to load unsynced partners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const response = await fetch('/api/integrations/metakocka/contacts/sync-from-metakocka', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metakockaIds: unsyncedPartners.map(p => p.id)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync contacts');
      }

      const result = await response.json();
      
      toast({
        title: "Sync Complete",
        description: `Successfully imported ${result.created} contacts from Metakocka`,
      });
      
      // Refresh the list
      fetchUnsyncedPartners();
    } catch (err) {
      console.error('Error syncing contacts:', err);
      toast({
        title: "Sync Failed",
        description: err instanceof Error ? err.message : 'Failed to sync contacts',
        variant: "destructive",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncIndividual = async (partnerId: string) => {
    setSyncingIndividual(partnerId);
    try {
      const response = await fetch('/api/integrations/metakocka/contacts/sync-from-metakocka', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metakockaIds: [partnerId]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync contact');
      }

      const result = await response.json();
      
      toast({
        title: "Sync Complete",
        description: `Successfully imported contact from Metakocka`,
      });
      
      // Refresh the list
      fetchUnsyncedPartners();
    } catch (err) {
      console.error('Error syncing contact:', err);
      toast({
        title: "Sync Failed",
        description: err instanceof Error ? err.message : 'Failed to sync contact',
        variant: "destructive",
      });
    } finally {
      setSyncingIndividual(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'import') {
      fetchUnsyncedPartners();
    }
  }, [activeTab]);

  const handleSyncComplete = (result: any) => {
    if (activeTab === 'import') {
      fetchUnsyncedPartners();
    }
    
    toast({
      title: 'Sync completed',
      description: `${result.created} created, ${result.updated} updated, ${result.failed} failed`,
      variant: result.failed > 0 ? 'destructive' : 'default',
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Metakocka Contact Integration</h1>
        <p className="text-muted-foreground mt-2">
          Manage contact synchronization between ARIS and Metakocka
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mappings">Contact Mappings</TabsTrigger>
          <TabsTrigger value="import">Import from Metakocka</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mappings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Mappings</CardTitle>
              <CardDescription>
                View and manage mappings between CRM contacts and Metakocka partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactMappingsTable />
            </CardContent>
          </Card>
        </TabsContent>
        

        
        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Partners from Metakocka</CardTitle>
                <CardDescription>
                  Import Metakocka partners as contacts in your CRM
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUnsyncedPartners}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm">
                  This will import partners from Metakocka that don't exist in your CRM yet.
                  You can import all partners at once or select specific ones to import.
                </p>
              </div>
              
              {isLoading && unsyncedPartners.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-4 text-destructive">
                  <p>{error}</p>
                </div>
              ) : unsyncedPartners.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No unsynced partners found in Metakocka</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {unsyncedPartners.length} unsynced partners found
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSyncAll}
                      disabled={syncingAll}
                    >
                      {syncingAll ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Import All
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">Name</th>
                          <th className="text-left py-2 px-4 font-medium">Code</th>
                          <th className="text-left py-2 px-4 font-medium">Email</th>
                          <th className="text-left py-2 px-4 font-medium">Type</th>
                          <th className="text-right py-2 px-4 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unsyncedPartners.map((partner) => (
                          <tr key={partner.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-4">{partner.name}</td>
                            <td className="py-2 px-4">{partner.code}</td>
                            <td className="py-2 px-4">{partner.email || '-'}</td>
                            <td className="py-2 px-4">
                              {partner.type === 'B' ? 'Business' : 'Person'}
                            </td>
                            <td className="py-2 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSyncIndividual(partner.id)}
                                disabled={syncingIndividual === partner.id}
                              >
                                {syncingIndividual === partner.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Import
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
