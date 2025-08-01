'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncSalesDocumentButton, SalesDocumentSyncSection } from '@/components/integrations/metakocka';
import { ArrowLeft, Download, Send, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

type SalesDocument = Database['public']['Tables']['sales_documents']['Row'];
type SalesDocumentItem = Database['public']['Tables']['sales_document_items']['Row'];

export default function SalesDocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  
  const [document, setDocument] = useState<SalesDocument | null>(null);
  const [items, setItems] = useState<SalesDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  async function fetchDocument() {
    setLoading(true);
    try {
      // Fetch document
      const { data: documentData, error: documentError } = await supabase
        .from('sales_documents')
        .select('*')
        .eq('id', params.id)
        .single();

      if (documentError) {
        throw documentError;
      }

      setDocument(documentData);

      // Fetch document items
      const { data: itemsData, error: itemsError } = await supabase
        .from('sales_document_items')
        .select('*')
        .eq('document_id', params.id)
        .order('id');

      if (itemsError) {
        throw itemsError;
      }

      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching sales document:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales document',
        variant: 'destructive',
      });
      router.push('/dashboard/sales-documents');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete document items first (due to foreign key constraints)
      const { error: itemsError } = await supabase
        .from('sales_document_items')
        .delete()
        .eq('document_id', params.id);

      if (itemsError) {
        throw itemsError;
      }

      // Delete document
      const { error: documentError } = await supabase
        .from('sales_documents')
        .delete()
        .eq('id', params.id);

      if (documentError) {
        throw documentError;
      }

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      router.push('/dashboard/sales-documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sales_documents')
        .update({ status: newStatus })
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      setDocument(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast({
        title: 'Success',
        description: `Document status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Document not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/sales-documents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">
            {document.document_type === 'invoice' ? 'Invoice' : 'Offer'}: {document.document_number || `#${document.id.substring(0, 8)}`}
          </h1>
          <div className="ml-4">
            {getStatusBadge(document.status)}
          </div>
        </div>
        <div className="flex space-x-2">
          <SyncSalesDocumentButton 
            documentId={document.id} 
            variant="outline" 
            size="sm" 
          />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {document.status === 'draft' && (
            <Button variant="success" size="sm" onClick={() => handleUpdateStatus('sent')}>
              <Send className="h-4 w-4 mr-2" />
              Mark as Sent
            </Button>
          )}
          {document.status === 'sent' && document.document_type === 'invoice' && (
            <Button size="sm" variant="success" onClick={() => handleUpdateStatus('paid')}>
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Type</dt>
                <dd className="font-medium">{document.document_type === 'invoice' ? 'Invoice' : 'Offer'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd>{getStatusBadge(document.status)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Document Date</dt>
                <dd>{formatDate(document.document_date)}</dd>
              </div>
              {document.due_date && (
                <div>
                  <dt className="text-sm text-gray-500">Due Date</dt>
                  <dd>{formatDate(document.due_date)}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Client</h3>
                <p className="font-medium">{document.customer_name}</p>
                {document.customer_email && (
                  <p className="text-sm text-gray-500">{document.customer_email}</p>
                )}
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Subtotal</dt>
                <dd>{formatCurrency(document.total_amount - document.tax_amount)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Tax</dt>
                <dd>{formatCurrency(document.tax_amount)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 font-bold">Total</dt>
                <dd className="font-bold">{formatCurrency(document.total_amount)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Item</th>
                  <th className="text-left py-2 px-4">Description</th>
                  <th className="text-right py-2 px-4">Quantity</th>
                  <th className="text-right py-2 px-4">Unit Price</th>
                  <th className="text-right py-2 px-4">Tax Rate</th>
                  <th className="text-right py-2 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-4">{item.product_id ? 'Product' : 'Service'}</td>
                    <td className="py-2 px-4">{item.description}</td>
                    <td className="text-right py-2 px-4">{item.quantity}</td>
                    <td className="text-right py-2 px-4">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right py-2 px-4">{item.tax_rate}%</td>
                    <td className="text-right py-2 px-4">{formatCurrency(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}></td>
                  <td className="text-right py-2 px-4 font-medium">Subtotal:</td>
                  <td className="text-right py-2 px-4">{formatCurrency(document.total_amount - document.tax_amount)}</td>
                </tr>
                <tr>
                  <td colSpan={4}></td>
                  <td className="text-right py-2 px-4 font-medium">Tax:</td>
                  <td className="text-right py-2 px-4">{formatCurrency(document.tax_amount)}</td>
                </tr>
                <tr>
                  <td colSpan={4}></td>
                  <td className="text-right py-2 px-4 font-bold">Total:</td>
                  <td className="text-right py-2 px-4 font-bold">{formatCurrency(document.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {document.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{document.notes}</p>
          </CardContent>
        </Card>
      )}
      
      <SalesDocumentSyncSection 
        documentId={params.id}
        className="mb-6"
        title="Metakocka Integration"
        description={`Sync this ${document.document_type} with your Metakocka ERP system`}
      />

      <div className="flex justify-between">
        <div>
          {document.status === 'draft' && (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Document'}
            </Button>
          )}
        </div>
        <div>
          {document.status === 'draft' && (
            <Link href={`/dashboard/sales-documents/${document.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Document
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
