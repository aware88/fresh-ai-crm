'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Supplier, SupplierDocument } from '@/types/supplier';
import { fetchSuppliers, uploadSupplierDocument, fetchSupplierDocuments } from '@/lib/suppliers/api';
import { formatDate, getDocumentTypeLabel } from '@/lib/suppliers/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UploadCloud, FileText, Download, Search } from 'lucide-react';

const documentTypes = [
  { value: 'offer', label: '💰 Offer' },
  { value: 'coa', label: '📊 Certificate of Analysis' },
  { value: 'specification', label: '📋 Specification' },
  { value: 'invoice', label: '📝 Invoice' },
  { value: 'pricelist', label: '💲 Price List' },
  { value: 'other', label: '📄 Other' }
];

export default function DocumentUploader() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('offer');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Load documents when supplier is selected
  useEffect(() => {
    if (selectedSupplierId) {
      loadDocuments(selectedSupplierId);
    } else {
      setDocuments([]);
    }
  }, [selectedSupplierId]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSuppliers();
      setSuppliers(data);
      
      // If there's at least one supplier, select the first one by default
      if (data.length > 0) {
        setSelectedSupplierId(data[0].id);
      }
    } catch (err) {
      setError('Failed to load suppliers. Please try again.');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (supplierId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSupplierDocuments(supplierId);
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents. Please try again.');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedSupplierId) {
      setError('Please select a supplier.');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      await uploadSupplierDocument(
        selectedFile,
        selectedSupplierId,
        selectedDocumentType
      );
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      
      // Reload documents
      await loadDocuments(selectedSupplierId);
      
      setSuccess('Document uploaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
    }
  };

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected supplier name
  const selectedSupplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || '';

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Upload Form */}
        <div className="bg-gradient-to-b from-blue-50 to-white p-6 rounded-lg border border-blue-100 shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mr-3 shadow-sm">
              <UploadCloud className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Upload Document</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier" className="text-blue-800 font-medium">Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="border-blue-200 focus:ring-blue-300">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="documentType" className="text-blue-800 font-medium">Document Type</Label>
              <Select
                value={selectedDocumentType}
                onValueChange={setSelectedDocumentType}
              >
                <SelectTrigger id="documentType" className="border-blue-200 focus:ring-blue-300">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="file">File (PDF, Excel, CSV)</Label>
              <div className="mt-1">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.xls,.xlsx,.csv"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={!selectedSupplierId || !selectedFile || uploading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                <span className="mr-2">✅</span> {success}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Document List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {selectedSupplierName ? `${selectedSupplierName}'s Documents` : 'Documents'}
            </h3>
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">Loading documents...</span>
            </div>
          ) : !selectedSupplierId ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">Please select a supplier to view documents.</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">
                {searchTerm 
                  ? 'No documents match your search.' 
                  : 'No documents found for this supplier.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {getDocumentTypeLabel(doc.documentType)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-gray-500" />
                          {doc.fileName}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/suppliers/download-document?id=${doc.id}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
