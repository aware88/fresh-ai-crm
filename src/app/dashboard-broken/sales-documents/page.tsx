'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncAllSalesDocumentsButton, SyncSalesDocumentButton, SyncFromMetakockaButton } from '@/components/integrations/metakocka';
import { PlusCircle, FileText, FileCheck, FileClock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

type SalesDocument = Database['public']['Tables']['sales_documents']['Row'];

export default function SalesDocumentsPage() {
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching sales documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredDocuments = documents.filter(doc => {
    if (activeTab === 'all') return true;
    if (activeTab === 'invoices') return doc.document_type === 'invoice';
    if (activeTab === 'offers') return doc.document_type === 'offer';
    return true;
  });

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales Documents</h1>
        <div className="flex gap-2">
          <SyncAllSalesDocumentsButton 
            onSyncComplete={() => {
              fetchDocuments();
              toast({
                title: 'Sync complete',
                description: 'Sales documents have been synchronized with Metakocka',
              });
            }} 
          />
          <SyncFromMetakockaButton
            onSyncComplete={() => {
              fetchDocuments();
              toast({
                title: 'Sync complete',
                description: 'Sales documents have been imported from Metakocka',
              });
            }}
          />
          <Link href="/dashboard/sales-documents/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">Create your first sales document to get started</p>
            <Link href="/dashboard/sales-documents/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <div className="flex">
                <div className="flex-grow">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>
                          <Link href={`/dashboard/sales-documents/${doc.id}`} className="hover:underline">
                            {doc.document_number || `#${doc.id.substring(0, 8)}`}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          {doc.document_type === 'invoice' ? (
                            <span className="flex items-center">
                              <FileCheck className="mr-1 h-4 w-4" /> Invoice
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <FileClock className="mr-1 h-4 w-4" /> Offer
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(doc.total_amount)}</div>
                        <div className="text-sm text-gray-500">
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p>{doc.client_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p>{formatDate(doc.document_date)}</p>
                      </div>
                      {doc.due_date && (
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p>{formatDate(doc.due_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
                <div className="flex items-center pr-4">
                  <SyncSalesDocumentButton 
                    documentId={doc.id} 
                    size="icon"
                    onSyncComplete={(success) => {
                      if (success) {
                        toast({
                          title: 'Document synced',
                          description: `Document ${doc.document_number || doc.id.substring(0, 8)} has been synchronized with Metakocka`,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
