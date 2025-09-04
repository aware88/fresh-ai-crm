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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SalesDocumentDetailPage({ params }: PageProps) {
  const [document, setDocument] = useState<SalesDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documentId, setDocumentId] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // Extract document ID from params
  useEffect(() => {
    const extractId = async () => {
      const { id } = await params;
      setDocumentId(id);
    };
    extractId();
  }, [params]);

  // Fetch sales document details
  useEffect(() => {
    if (!documentId) return;
    
    const fetchDocumentDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch the document
        const { data: documentData, error: documentError } = await supabase
          .from('sales_documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (documentError) {
          throw documentError;
        }

        // Fetch document items
        const { data: itemsData, error: itemsError } = await supabase
          .from('sales_document_items')
          .select('*')
          .eq('document_id', documentId);

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
  }, [documentId, supabase, toast]);

  // Handle back button click
  const handleBackClick = () => {
    router.push('/sales-documents');
  };

  // Handle edit button click
  const handleEditClick = () => {
    router.push(`/sales-documents/${documentId}/edit`);
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
        .eq('document_id', documentId);

      if (itemsError) {
        throw itemsError;
      }

      // Then delete the document
      const { error: documentError } = await supabase
        .from('sales_documents')
        .delete()
        .eq('id', documentId);

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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBackClick} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditClick} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDeleteClick} className="flex items-center gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{document.name}</CardTitle>
              <p className="text-muted-foreground">Document #{document.document_number}</p>
            </div>
            <Badge variant={document.status === 'paid' ? 'default' : 'secondary'}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Client Information</h3>
              <p className="text-sm">{document.client_name}</p>
              <p className="text-sm text-muted-foreground">{document.client_email}</p>
              <p className="text-sm text-muted-foreground">{document.client_address}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dates</h3>
              <p className="text-sm">Issue Date: {formatDate(document.date)}</p>
              <p className="text-sm">Due Date: {formatDate(document.due_date)}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Amount</h3>
              <p className="text-2xl font-bold">{formatCurrency(document.total_amount)}</p>
              <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(document.subtotal_amount)}</p>
              <p className="text-sm text-muted-foreground">Tax: {formatCurrency(document.tax_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
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
        </CardContent>
      </Card>

      {document.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{document.notes}</p>
          </CardContent>
        </Card>
      )}

      <SalesDocumentSyncSection documentId={documentId} />

      <div className="flex justify-end mt-6">
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}