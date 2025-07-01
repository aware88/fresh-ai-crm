import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { getEmailMetakockaMetadata, processEmailForMetakocka } from '@/lib/integrations/metakocka/email-api';
import { Loader2, FileText, User, Tag, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface MetakockaEmailInfoProps {
  emailId: string;
}

export function MetakockaEmailInfo({ emailId }: MetakockaEmailInfoProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [contactMappings, setContactMappings] = useState<any[]>([]);
  const [documentMappings, setDocumentMappings] = useState<any[]>([]);

  // Fetch email metadata on component mount
  useEffect(() => {
    fetchMetadata();
  }, [emailId]);

  // Function to fetch email metadata
  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getEmailMetakockaMetadata(emailId);
      setMetadata(data.metakocka_metadata);
      setContactMappings(data.email_metakocka_contact_mappings || []);
      setDocumentMappings(data.email_metakocka_document_mappings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching Metakocka data');
    } finally {
      setLoading(false);
    }
  };

  // Function to process the email for Metakocka data
  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      await processEmailForMetakocka(emailId);
      // Refresh the metadata after processing
      await fetchMetadata();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing email');
    } finally {
      setProcessing(false);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Metakocka Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading Metakocka data...</span>
        </CardContent>
      </Card>
    );
  }

  // If no metadata and not processing, show process button
  if (!metadata && !processing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Metakocka Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              No Metakocka data found for this email.
            </p>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Process Email
                </>
              )}
            </Button>
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If processing, show processing state
  if (processing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Metakocka Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Processing email...</span>
        </CardContent>
      </Card>
    );
  }

  // Render metadata, contact mappings, and document mappings
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Metakocka Information</CardTitle>
        <Tooltip content="Refresh Metakocka data">
          <Button variant="ghost" size="sm" onClick={fetchMetadata} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </Tooltip>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}
        
        {/* Display extracted data */}
        {metadata?.extractedData && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Extracted Information</h3>
            <div className="space-y-2">
              {metadata.extractedData.invoiceNumbers?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Invoices:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.extractedData.invoiceNumbers.map((inv: string, i: number) => (
                      <Badge key={i} variant="outline">{inv}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {metadata.extractedData.offerNumbers?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Offers:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.extractedData.offerNumbers.map((offer: string, i: number) => (
                      <Badge key={i} variant="outline">{offer}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {metadata.extractedData.orderNumbers?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Orders:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.extractedData.orderNumbers.map((order: string, i: number) => (
                      <Badge key={i} variant="outline">{order}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {metadata.extractedData.amounts?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Amounts:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.extractedData.amounts.map((amount: number, i: number) => (
                      <Badge key={i} variant="outline">{amount}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {metadata.extractedData.productNames?.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Products:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.extractedData.productNames.map((product: string, i: number) => (
                      <Badge key={i} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Display linked contacts */}
        {contactMappings.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Linked Contacts</h3>
            <div className="space-y-2">
              {contactMappings.map((mapping) => (
                <div key={mapping.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{mapping.metakocka_contact_id}</span>
                  </div>
                  <Badge variant={mapping.confidence > 0.7 ? "success" : "warning"}>
                    {Math.round(mapping.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Display linked documents */}
        {documentMappings.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Linked Documents</h3>
            <div className="space-y-2">
              {documentMappings.map((mapping) => (
                <div key={mapping.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {mapping.document_type}: {mapping.metakocka_document_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mapping.confidence > 0.7 ? "success" : "warning"}>
                      {Math.round(mapping.confidence * 100)}%
                    </Badge>
                    {mapping.metakocka_mapping_id && (
                      <Link href={`/sales-documents/${mapping.metakocka_mapping_id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Show process button to re-process the email */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleProcess} 
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-process
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
