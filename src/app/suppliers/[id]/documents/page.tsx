'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchSupplierById } from '@/lib/suppliers/api';
import { fetchSupplierDocuments, deleteSupplierDocument, SupplierDocument, processDocumentWithAI } from '@/lib/suppliers/documents-api';
import { DocumentUpload } from '@/components/suppliers/DocumentUpload';
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
import { 
  FileText, 
  Trash, 
  ExternalLink, 
  AlertCircle, 
  Loader2,
  Brain,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function SupplierDocumentsPage() {
  const params = useParams();
  const supplierId = params.id as string;
  
  const [supplier, setSupplier] = useState<{ id: string; name: string } | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  
  // Load supplier and documents
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load supplier details
        const supplierData = await fetchSupplierById(supplierId);
        setSupplier(supplierData);
        
        // Load supplier documents
        await loadDocuments();
        
        setError(null);
      } catch (err) {
        console.error('Error loading supplier data:', err);
        setError('Failed to load supplier data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (supplierId) {
      loadData();
    }
  }, [supplierId]);
  
  // Function to load documents
  const loadDocuments = async () => {
    try {
      const docsData = await fetchSupplierDocuments(supplierId);
      setDocuments(docsData);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteSupplierDocument(documentId);
        // Reload documents after deletion
        await loadDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        setError('Failed to delete document');
      }
    }
  };
  
  // Handle AI processing
  const handleProcessDocument = async (documentId: string) => {
    setProcessingDocId(documentId);
    try {
      await processDocumentWithAI(documentId);
      // Reload documents to get updated status
      await loadDocuments();
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to process document with AI');
    } finally {
      setProcessingDocId(null);
    }
  };
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };
  
  // Get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'processed':
        return <Badge variant="default">Processed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Needs Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {supplier ? supplier.name : 'Supplier'} Documents
        </h1>
        <p className="text-gray-500">
          Upload and manage documents for this supplier. AI will automatically extract pricing and product data.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document upload card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload 
                supplierId={supplierId} 
                onUploadComplete={loadDocuments}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Documents list */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="font-medium">{doc.file_name}</div>
                            <div className="text-sm text-gray-500">{doc.file_type}</div>
                          </TableCell>
                          <TableCell>{doc.document_type}</TableCell>
                          <TableCell>{formatDate(doc.upload_date)}</TableCell>
                          <TableCell>{getStatusBadge(doc.processing_status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                asChild
                              >
                                <Link href={`/api/suppliers/documents/view?id=${doc.id}`} target="_blank">
                                  <ExternalLink size={16} />
                                </Link>
                              </Button>
                              
                              {doc.processing_status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleProcessDocument(doc.id)}
                                  disabled={processingDocId === doc.id}
                                >
                                  {processingDocId === doc.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Brain size={16} />
                                  )}
                                </Button>
                              )}
                              
                              {doc.processing_status === 'pending_review' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/suppliers/${supplierId}/documents/${doc.id}/review`}>
                                    <Eye size={16} />
                                  </Link>
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
