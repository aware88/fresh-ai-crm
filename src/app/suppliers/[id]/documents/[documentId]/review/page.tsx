'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchSupplierById } from '@/lib/suppliers/api';
import { fetchSupplierDocuments, updateDocumentStatus } from '@/lib/suppliers/documents-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertCircle, 
  Loader2,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Trash,
  ArrowLeft
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetakockaDataPanel } from '@/components/integrations/metakocka/MetakockaDataPanel';

interface Product {
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
}

interface Pricing {
  product_name: string;
  price: number;
  currency: string;
  unit_price: boolean;
  quantity: number;
  unit: string;
  valid_from: string | null;
  valid_to: string | null;
  notes: string | null;
}

interface ExtractedData {
  products: Product[];
  pricing: Pricing[];
  metadata: {
    document_date: string | null;
    reference_number: string | null;
    additional_notes: string | null;
  };
}

export default function DocumentReviewPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;
  const documentId = params?.documentId as string;
  
  const [supplier, setSupplier] = useState<{ id: string; name: string } | null>(null);
  const [document, setDocument] = useState<any | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  
  // Load supplier and document data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load supplier details
        const supplierData = await fetchSupplierById(supplierId);
        setSupplier(supplierData);
        
        // Load document details
        const docsData = await fetchSupplierDocuments(supplierId);
        const doc = docsData.find(d => d.id === documentId);
        
        if (!doc) {
          setError('Document not found');
          return;
        }
        
        setDocument(doc);
        
        // Set extracted data
        if (doc.extracted_data) {
          setExtractedData(doc.extracted_data as ExtractedData);
        } else {
          setError('No extracted data found for this document');
        }
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load document data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (supplierId && documentId) {
      loadData();
    }
  }, [supplierId, documentId]);
  
  // Handle product update
  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    if (!extractedData) return;
    
    const updatedProducts = [...extractedData.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    
    setExtractedData({
      ...extractedData,
      products: updatedProducts
    });
  };
  
  // Handle pricing update
  const handlePricingChange = (index: number, field: keyof Pricing, value: any) => {
    if (!extractedData) return;
    
    const updatedPricing = [...extractedData.pricing];
    updatedPricing[index] = {
      ...updatedPricing[index],
      [field]: value
    };
    
    setExtractedData({
      ...extractedData,
      pricing: updatedPricing
    });
  };
  
  // Handle metadata update
  const handleMetadataChange = (field: string, value: string) => {
    if (!extractedData) return;
    
    setExtractedData({
      ...extractedData,
      metadata: {
        ...extractedData.metadata,
        [field]: value
      }
    });
  };
  
  // Add new product
  const handleAddProduct = () => {
    if (!extractedData) return;
    
    const newProduct: Product = {
      name: '',
      sku: null,
      description: null,
      category: null
    };
    
    setExtractedData({
      ...extractedData,
      products: [...extractedData.products, newProduct]
    });
  };
  
  // Add new pricing
  const handleAddPricing = () => {
    if (!extractedData) return;
    
    const newPricing: Pricing = {
      product_name: '',
      price: 0,
      currency: 'USD',
      unit_price: true,
      quantity: 1,
      unit: 'each',
      valid_from: null,
      valid_to: null,
      notes: null
    };
    
    setExtractedData({
      ...extractedData,
      pricing: [...extractedData.pricing, newPricing]
    });
  };
  
  // Remove product
  const handleRemoveProduct = (index: number) => {
    if (!extractedData) return;
    
    const updatedProducts = [...extractedData.products];
    updatedProducts.splice(index, 1);
    
    setExtractedData({
      ...extractedData,
      products: updatedProducts
    });
  };
  
  // Remove pricing
  const handleRemovePricing = (index: number) => {
    if (!extractedData) return;
    
    const updatedPricing = [...extractedData.pricing];
    updatedPricing.splice(index, 1);
    
    setExtractedData({
      ...extractedData,
      pricing: updatedPricing
    });
  };
  
  // Handle approval
  const handleApprove = async () => {
    if (!document || !extractedData) return;
    
    setIsSubmitting(true);
    try {
      await updateDocumentStatus(documentId, 'approved');
      router.push(`/suppliers/${supplierId}/documents`);
    } catch (err) {
      console.error('Error approving document:', err);
      setError('Failed to approve document');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle rejection
  const handleReject = async () => {
    if (!document) return;
    
    setIsSubmitting(true);
    try {
      // For rejection, we pass 'rejected' which will be converted to approved: false
      await updateDocumentStatus(documentId, 'rejected');
      router.push(`/suppliers/${supplierId}/documents`);
    } catch (err) {
      console.error('Error rejecting document:', err);
      setError('Failed to reject document');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return dateStr;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/suppliers/${supplierId}/documents`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">
          Review Extracted Data
        </h1>
        <p className="text-gray-500">
          {supplier?.name} - {document?.file_name}
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {extractedData && (
        <div className="space-y-6">
          {/* Document Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document_date">Document Date</Label>
                  <Input
                    id="document_date"
                    type="date"
                    value={formatDate(extractedData.metadata.document_date)}
                    onChange={(e) => handleMetadataChange('document_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={extractedData.metadata.reference_number || ''}
                    onChange={(e) => handleMetadataChange('reference_number', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    value={extractedData.metadata.additional_notes || ''}
                    onChange={(e) => handleMetadataChange('additional_notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Products and Pricing Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="products">
                Products ({extractedData.products.length})
              </TabsTrigger>
              <TabsTrigger value="pricing">
                Pricing ({extractedData.pricing.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Products</CardTitle>
                  <Button onClick={handleAddProduct} size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </CardHeader>
                <CardContent>
                  {extractedData.products.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No products found in this document
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extractedData.products.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={product.name}
                                  onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={product.sku || ''}
                                  onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={product.category || ''}
                                  onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={product.description || ''}
                                  onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveProduct(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pricing Tab */}
            <TabsContent value="pricing">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Pricing</CardTitle>
                  <Button onClick={handleAddPricing} size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Add Pricing
                  </Button>
                </CardHeader>
                <CardContent>
                  {extractedData.pricing.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No pricing information found in this document
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Valid From</TableHead>
                            <TableHead>Valid To</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extractedData.pricing.map((pricing, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={pricing.product_name}
                                  onChange={(e) => handlePricingChange(index, 'product_name', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={pricing.price}
                                  onChange={(e) => handlePricingChange(index, 'price', parseFloat(e.target.value))}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={pricing.currency}
                                  onChange={(e) => handlePricingChange(index, 'currency', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={pricing.quantity}
                                  onChange={(e) => handlePricingChange(index, 'quantity', parseInt(e.target.value))}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={pricing.unit}
                                  onChange={(e) => handlePricingChange(index, 'unit', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="date"
                                  value={formatDate(pricing.valid_from)}
                                  onChange={(e) => handlePricingChange(index, 'valid_from', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="date"
                                  value={formatDate(pricing.valid_to)}
                                  onChange={(e) => handlePricingChange(index, 'valid_to', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={pricing.notes || ''}
                                  onChange={(e) => handlePricingChange(index, 'notes', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePricing(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Metakocka Integration Panel */}
          <div className="mt-6 mb-6">
            <MetakockaDataPanel documentId={documentId} userId={document?.created_by || ''} />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve & Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
