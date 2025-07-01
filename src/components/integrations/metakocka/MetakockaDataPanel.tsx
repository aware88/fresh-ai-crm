import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';

interface MetakockaDataPanelProps {
  documentId: string;
  userId: string;
}

export function MetakockaDataPanel({ documentId, userId }: MetakockaDataPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const metakockaData = await getMetakockaDataForAIContext(userId);
        setData(metakockaData);
        setError(null);
      } catch (err) {
        console.error('Error fetching Metakocka data:', err);
        setError('Failed to load Metakocka data');
      } finally {
        setLoading(false);
      }
    }

    if (documentId && userId) {
      fetchData();
    }
  }, [documentId, userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Metakocka Integration</span>
            <Skeleton className="h-4 w-16 ml-2" />
          </CardTitle>
          <CardDescription>Loading integration data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Metakocka Integration</span>
            <Badge variant="destructive" className="ml-2">Error</Badge>
          </CardTitle>
          <CardDescription>{error || 'No Metakocka data available'}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {!data ? 'This user does not have Metakocka integration configured.' : 
             'There was an error loading Metakocka data. Please try again later.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Metakocka Integration</span>
          <Badge variant="outline" className="ml-2">Active</Badge>
        </CardTitle>
        <CardDescription>
          Data synchronized {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'recently'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products ({data.products?.length || 0})</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({data.contacts?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents">Sales Documents ({data.salesDocuments?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            {data.products && data.products.length > 0 ? (
              <div className="space-y-2">
                {data.products.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="p-2 border rounded-md">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</div>
                    {product.inventory && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Inventory: </span>
                        <span>{product.inventory.quantityAvailable} available</span>
                        {product.inventory.quantityReserved > 0 && (
                          <span> ({product.inventory.quantityReserved} reserved)</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {data.products.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    + {data.products.length - 5} more products
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No product data available</p>
            )}
          </TabsContent>
          
          <TabsContent value="contacts" className="space-y-4">
            {data.contacts && data.contacts.length > 0 ? (
              <div className="space-y-2">
                {data.contacts.slice(0, 5).map((contact: any) => (
                  <div key={contact.id} className="p-2 border rounded-md">
                    <div className="font-medium">{contact.name}</div>
                    {contact.email && (
                      <div className="text-sm text-muted-foreground">{contact.email}</div>
                    )}
                    {contact.company && (
                      <div className="text-xs text-muted-foreground">{contact.company}</div>
                    )}
                  </div>
                ))}
                {data.contacts.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    + {data.contacts.length - 5} more contacts
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contact data available</p>
            )}
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            {data.salesDocuments && data.salesDocuments.length > 0 ? (
              <div className="space-y-2">
                {data.salesDocuments.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="p-2 border rounded-md">
                    <div className="font-medium">
                      {doc.documentType} {doc.documentNumber}
                    </div>
                    <div className="text-sm">
                      {doc.customerName}
                      {doc.totalAmount && (
                        <span className="ml-2 font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(doc.totalAmount)}
                        </span>
                      )}
                    </div>
                    {doc.documentDate && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(doc.documentDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {data.salesDocuments.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    + {data.salesDocuments.length - 5} more documents
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sales document data available</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
