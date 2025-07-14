'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, Upload, AlertCircle, FileText, Database, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkImportGuide } from "./BulkImportGuide";

interface FileStatus {
  exists: boolean;
  lastModified?: string;
  size?: number;
  sheetCount?: number;
  sheets?: string[];
  recordCount?: number;
  message: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

type EntityType = 'contacts' | 'suppliers' | 'products' | 'prices' | 'psychology' | 'profile';

export function UnifiedDataUploader() {
  const [activeTab, setActiveTab] = useState('excel');
  const [entityType, setEntityType] = useState<EntityType>('contacts');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [entityStatus, setEntityStatus] = useState<Record<EntityType, FileStatus>>({
    contacts: { exists: false, status: 'idle', message: 'No contacts data uploaded' },
    suppliers: { exists: false, status: 'idle', message: 'No suppliers data uploaded' },
    products: { exists: false, status: 'idle', message: 'No products data uploaded' },
    prices: { exists: false, status: 'idle', message: 'No prices data uploaded' },
    psychology: { exists: false, status: 'idle', message: 'No psychology data uploaded' },
    profile: { exists: false, status: 'idle', message: 'No profile data uploaded' }
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Removed useEffect that checked for /api/check-excel-data and /api/check-profile-data

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // Validate file extension based on active tab and entity type
      if (activeTab === 'excel') {
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          setFile(selectedFile);
          setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
        } else {
          setFile(null);
          setMessage({ 
            text: 'Please select an Excel file (.xlsx or .xls extension)',
            type: 'error' 
          });
        }
      } else if (activeTab === 'profile') {
        if (fileExtension === 'csv') {
          setFile(selectedFile);
          setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
        } else {
          setFile(null);
          setMessage({ 
            text: 'Please select a CSV file (.csv extension)',
            type: 'error' 
          });
        }
      } else if (activeTab === 'bulk') {
        // For bulk uploads, accept both Excel and CSV
        if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
          setFile(selectedFile);
          setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
        } else {
          setFile(null);
          setMessage({ 
            text: 'Please select an Excel file (.xlsx or .xls) or CSV file (.csv)',
            type: 'error' 
          });
        }
      }
    } else {
      setFile(null);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: 'Please select a file first', type: 'error' });
      return;
    }

    setIsUploading(true);
    setMessage({ text: 'Uploading and processing file...', type: 'info' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      let endpoint = '';
      
      // Upload to the appropriate endpoint based on active tab and entity type
      if (activeTab === 'excel') {
        endpoint = '/api/upload-excel-data';
      } else if (activeTab === 'profile') {
        endpoint = '/api/upload-profile-data';
      } else if (activeTab === 'bulk') {
        // For bulk uploads, include the entity type
        endpoint = `/api/bulk-import/${entityType}`;
        formData.append('entityType', entityType);
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      
      // Update status based on active tab
      if (activeTab === 'excel') {
        setEntityStatus(prev => ({
          ...prev,
          [entityType]: {
            exists: true,
            lastModified: new Date().toLocaleString(),
            size: file.size,
            sheetCount: data.sheetCount,
            sheets: data.sheets,
            status: 'success',
            message: 'Excel data file uploaded successfully'
          }
        }));
        setMessage({ 
          text: `Excel data uploaded successfully! ${data.sheetCount} sheets were processed.`,
          type: 'success' 
        });
      } else if (activeTab === 'profile') {
        setEntityStatus(prev => ({
          ...prev,
          [entityType]: {
            exists: true,
            lastModified: new Date().toLocaleString(),
            size: file.size,
            status: 'success',
            message: 'Personality profile data uploaded successfully'
          }
        }));
        setMessage({ 
          text: 'Personality profile data uploaded successfully!',
          type: 'success' 
        });
      } else if (activeTab === 'bulk') {
        // Update entity status for bulk uploads
        setEntityStatus(prev => ({
          ...prev,
          [entityType]: {
            exists: true,
            lastModified: new Date().toLocaleString(),
            size: file.size,
            recordCount: data.recordCount,
            status: 'success',
            message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} data uploaded successfully`
          }
        }));
        setMessage({ 
          text: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} data uploaded successfully! ${data.recordCount} records were processed.`,
          type: 'success' 
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      setMessage({ 
        text: error instanceof Error ? error.message : 'Failed to upload file', 
        type: 'error' 
      });
    } finally {
      setIsUploading(false);
      setFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-50">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-teal-800">Unified Data Uploader</CardTitle>
            <CardDescription>
              Upload personality profile data in various formats. The AI will use all available data sources when analyzing emails.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <HelpCircle className="h-4 w-4" />
            {showGuide ? 'Hide Guide' : 'Import Guide'}
          </Button>
        </div>
        
        {showGuide && (
          <div className="mt-4">
            <BulkImportGuide />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <Tabs defaultValue="bulk" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            <TabsTrigger value="excel">Excel Data</TabsTrigger>
            <TabsTrigger value="profile">Profile Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bulk" className="space-y-4">
            <div className="p-4 border border-dashed border-blue-200 rounded-lg bg-white/50 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Bulk Data Import</h3>
              <p className="text-xs text-gray-600 mb-3">
                Upload Excel or CSV files to import multiple records at once. Select the entity type below.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Entity Type</label>
                  <Select
                    value={entityType}
                    onValueChange={(value) => setEntityType(value as EntityType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">Contacts</SelectItem>
                      <SelectItem value="suppliers">Suppliers</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="prices">Prices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-teal-50 file:text-teal-700
                      hover:file:bg-teal-100"
                    disabled={isUploading}
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || isUploading}
                    className="whitespace-nowrap bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                
                {file && activeTab === 'bulk' && (
                  <div className="text-sm text-teal-700 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                  </div>
                )}
                
                {entityStatus[entityType].status === 'success' && (
                  <div className="mt-2 text-sm text-green-700 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    <div>
                      <p>{entityStatus[entityType].message}</p>
                      {entityStatus[entityType].recordCount && (
                        <p className="text-xs">Records processed: {entityStatus[entityType].recordCount}</p>
                      )}
                      {entityStatus[entityType].lastModified && (
                        <p className="text-xs">Last modified: {entityStatus[entityType].lastModified}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {entityStatus[entityType].status === 'error' && (
                  <div className="mt-2 text-sm text-red-700 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>{entityStatus[entityType].message}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <h4 className="text-xs font-medium text-blue-800 mb-1">Template Format Guidelines:</h4>
                {entityType === 'contacts' && (
                  <p className="text-xs text-gray-600">Include columns for: name, email, phone, company, title, etc.</p>
                )}
                {entityType === 'suppliers' && (
                  <p className="text-xs text-gray-600">Include columns for: name, email, phone, website, address, etc.</p>
                )}
                {entityType === 'products' && (
                  <p className="text-xs text-gray-600">Include columns for: name, SKU, description, price, category, etc.</p>
                )}
                {entityType === 'prices' && (
                  <p className="text-xs text-gray-600">Include columns for: product_id, price, effective_date, currency, etc.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="excel" className="space-y-4">
            <div className="p-4 border border-dashed border-teal-200 rounded-lg bg-white/50 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-teal-800 mb-2">Upload Excel File</h3>
              <p className="text-xs text-gray-600 mb-3">
                Upload Excel files with multiple sheets and custom column headers. 
                Perfect for organizations with existing personality profile data in their own format.
              </p>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-teal-50 file:text-teal-700
                      hover:file:bg-teal-100"
                    disabled={isUploading}
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || isUploading}
                    className="whitespace-nowrap bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                
                {file && activeTab === 'excel' && (
                  <div className="text-sm text-teal-700 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="profile" className="space-y-4">
            <div className="p-4 border border-dashed border-blue-200 rounded-lg bg-white/50 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Personality Profile CSV</h3>
              <p className="text-xs text-gray-600 mb-3">
                Upload a CSV file containing personality profiles for email analysis. The AI will use these profiles to analyze customer emails and provide personalized response suggestions.
              </p>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    disabled={isUploading}
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || isUploading}
                    className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                
                {file && activeTab === 'profile' && (
                  <div className="text-sm text-blue-700 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex">
              {message.type === 'success' && <Check className="h-5 w-5 mr-2" />}
              {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
              {message.type === 'info' && <FileText className="h-5 w-5 mr-2" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-white/50 backdrop-blur-sm border-t border-teal-100 px-6 py-4">
        <div className="w-full text-xs text-gray-600">
          <p className="font-medium mb-1">Data Upload Benefits:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Bulk Import:</strong> Upload contacts, suppliers, products, and prices in bulk</li>
              <li><strong>Multiple Formats:</strong> Support for Excel (.xlsx, .xls), CSV (.csv), and Word (.docx) files</li>
              <li><strong>Smart Parsing:</strong> Automatic detection of tables and structured data</li>
              <li><strong>Flexible:</strong> Works with various column structures and data formats</li>
            </ul>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Excel:</strong> Upload multiple data sheets in a single file</li>
              <li><strong>Word:</strong> Extract data from tables or structured text in documents</li>
              <li><strong>CSV:</strong> Simple format for standard data and personality profiles</li>
              <li><strong>Efficient:</strong> Process hundreds or thousands of records at once</li>
            </ul>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-blue-600 flex items-center">
              <HelpCircle className="h-3 w-3 mr-1" />
              <span>Click the <strong>Import Guide</strong> button above for detailed format instructions and examples</span>
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
