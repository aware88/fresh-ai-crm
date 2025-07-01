'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Edit, Trash2 } from 'lucide-react';
import { SalesDocumentSyncSection } from '@/components/integrations/metakocka/SalesDocumentSyncSection';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SalesDocument {
  id: string;
  name: string;
  document_number: string;
  date: string;
  due_date: string;
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  status: string;
  client_name: string;
  client_email: string;
  client_address: string;
  notes: string;
  items: SalesDocumentItem[];
}

interface SalesDocumentItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function SalesDocumentDetailPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<SalesDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Fetch sales document details
  useEffect(() => {
    const fetchDocumentDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch the document
        const { data: documentData, error: documentError } = await supabase
          .from('sales_documents')
          .select('*')
          .eq('id', params.id)
          .single();

        if (documentError) {
          throw documentError;
        }

        // Fetch document items
        const { data: itemsData, error: itemsError } = await supabase
          .from('sales_document_items')
          .select('*')
          .eq('document_id', params.id);

        if (itemsError) {
          throw itemsError;
        }

        setDocument({
          ...documentData,
          items: itemsData || []
        });
      } catch (error) {
        console.error('Error fetching document details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load document details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [params.id, supabase, toast]);

  // Handle back button click
  const handleBackClick = () => {
    router.push('/sales-documents');
  };

  // Handle edit button click
  const handleEditClick = () => {
    router.push(`/sales-documents/${params.id}/edit`);
  };

  // Handle delete button click
  const handleDeleteClick = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      // Delete document items first
      const { error: itemsError } = await supabase
        .from('sales_document_items')
        .delete()
        .eq('document_id', params.id);

      if (itemsError) {
        throw itemsError;
      }

      // Then delete the document
      const { error: documentError } = await supabase
        .from('sales_documents')
        .delete()
        .eq('id', params.id);

      if (documentError) {
        throw documentError;
      }

      toast({
        title: 'Document deleted',
        description: 'The sales document has been successfully deleted',
      });

      router.push('/sales-documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the document',
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold">Document not found</h2>
        <p className="text-muted-foreground mt-2">
          The requested document could not be found.
        </p>
        <Button onClick={handleBackClick} className="mt-4">
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleBackClick} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEditClick} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDeleteClick} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{document.name}</CardTitle>
                  <p className="text-muted-foreground">#{document.document_number}</p>
                </div>
                <Badge
                  variant={
                    document.status === 'paid' ? 'success' :
                    document.status === 'pending' ? 'warning' :
                    'outline'
                  }
                  className="uppercase"
                >
                  {document.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Client Information</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{document.client_name}</p>
                    <p>{document.client_email}</p>
                    <p className="whitespace-pre-line">{document.client_address}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Document Details</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(document.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{formatDate(document.due_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="capitalize">{document.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {document.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(document.subtotal_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatCurrency(document.tax_amount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(document.total_amount)}</span>
                  </div>
                </div>
              </div>

              {document.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{document.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SalesDocumentSyncSection 
            documentId={document.id}
            title="Metakocka Integration"
            description="Sync this document with your Metakocka ERP system"
          />
          
          {/* Additional side panels can be added here */}
        </div>
      </div>
    </div>
  );
}
