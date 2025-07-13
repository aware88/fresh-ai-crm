'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { SalesDocumentBulkSyncUI } from '@/components/integrations/metakocka/SalesDocumentBulkSyncUI';
import { SyncSalesDocumentButton } from '@/components/integrations/metakocka/SyncSalesDocumentButton';
import { createSafeClient } from '@/lib/supabase/safe-client';

interface SalesDocument {
  id: string;
  name: string;
  document_number: string;
  date: string;
  total_amount: number;
  status: string;
  client_name: string;
}

export default function SalesDocumentsPage() {
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkSync, setShowBulkSync] = useState(false);
  const router = useRouter();
  const supabase = createSafeClient();

  // Fetch sales documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('sales_documents')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching sales documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [supabase]);

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.document_number.toLowerCase().includes(query) ||
      doc.client_name.toLowerCase().includes(query)
    );
  });

  // Handle document creation
  const handleCreateDocument = () => {
    router.push('/sales-documents/new');
  };

  // Handle document selection
  const handleDocumentClick = (documentId: string) => {
    router.push(`/sales-documents/${documentId}`);
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Documents</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowBulkSync(!showBulkSync)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {showBulkSync ? 'Hide Bulk Sync' : 'Show Bulk Sync'}
            {showBulkSync ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
          <Button onClick={handleCreateDocument} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {showBulkSync && (
        <SalesDocumentBulkSyncUI 
          documents={filteredDocuments}
          onSyncComplete={() => {
            // Refresh the documents list after sync
            router.refresh();
          }}
          className="mb-6"
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => handleDocumentClick(doc.id)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                      <CardDescription>#{doc.document_number}</CardDescription>
                    </div>
                    <SyncSalesDocumentButton 
                      documentId={doc.id}
                      size="icon"
                      className="ml-2"
                      onSyncComplete={() => router.refresh()}
                    />
                  </div>
                </CardHeader>
                <CardContent className="cursor-pointer" onClick={() => handleDocumentClick(doc.id)}>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">{doc.client_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{formatDate(doc.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{formatCurrency(doc.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${
                        doc.status === 'paid' ? 'text-green-600' :
                        doc.status === 'pending' ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocumentClick(doc.id);
                    }}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Bulk sync UI is now shown above the document list when toggled */}
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Create your first sales document'}
          </p>
        </div>
      )}
    </div>
  );
}
