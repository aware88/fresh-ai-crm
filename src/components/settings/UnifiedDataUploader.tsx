'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, Upload, AlertCircle, FileText, Table, Database } from 'lucide-react';

interface FileStatus {
  exists: boolean;
  lastModified?: string;
  size?: number;
  sheetCount?: number;
  sheets?: string[];
  message: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export function UnifiedDataUploader() {
  const [activeTab, setActiveTab] = useState('excel');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [excelStatus, setExcelStatus] = useState<FileStatus>({
    exists: false,
    status: 'loading',
    message: 'Checking for existing Excel data...'
  });
  const [profileStatus, setProfileStatus] = useState<FileStatus>({
    exists: false,
    status: 'loading',
    message: 'Checking for existing profile data...'
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Check if files exist on component mount
  useEffect(() => {
    const checkExcelFile = async () => {
      try {
        const response = await fetch('/api/check-excel-data');
        const data = await response.json();
        
        if (data.exists) {
          setExcelStatus({
            exists: true,
            lastModified: data.lastModified,
            size: data.size,
            sheetCount: data.sheetCount,
            sheets: data.sheets,
            status: 'success',
            message: 'Excel data file is loaded and ready to use'
          });
        } else {
          setExcelStatus({
            exists: false,
            status: 'idle',
            message: 'No Excel data file found. Please upload an Excel file (.xlsx).'
          });
        }
      } catch (error) {
        console.error('Error checking Excel file:', error);
        setExcelStatus({
          exists: false,
          status: 'error',
          message: 'Error checking Excel data file'
        });
      }
    };

    const checkProfileFile = async () => {
      try {
        const response = await fetch('/api/check-profile-data');
        const data = await response.json();
        
        if (data.exists) {
          setProfileStatus({
            exists: true,
            lastModified: data.lastModified,
            size: data.size,
            status: 'success',
            message: 'Personality profile data is loaded and ready to use'
          });
        } else {
          setProfileStatus({
            exists: false,
            status: 'idle',
            message: 'No personality profile data found. Please upload a CSV file.'
          });
        }
      } catch (error) {
        console.error('Error checking profile file:', error);
        setProfileStatus({
          exists: false,
          status: 'error',
          message: 'Error checking personality profile data'
        });
      }
    };

    checkExcelFile();
    checkProfileFile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // Validate file extension based on active tab
      if (activeTab === 'excel' && (fileExtension === 'xlsx' || fileExtension === 'xls')) {
        setFile(selectedFile);
        setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
      } else if (activeTab === 'profile' && fileExtension === 'csv') {
        setFile(selectedFile);
        setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
      } else {
        setFile(null);
        setMessage({ 
          text: activeTab === 'excel' 
            ? 'Please select an Excel file (.xlsx or .xls extension)' 
            : 'Please select a CSV file (.csv extension)', 
          type: 'error' 
        });
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
    setMessage({ text: 'Uploading...', type: 'info' });

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Determine endpoint based on active tab
      const endpoint = activeTab === 'excel' ? '/api/upload-excel-data' : '/api/upload-profile-data';

      // Send the file to the server
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update file status after successful upload
      if (activeTab === 'excel') {
        setExcelStatus({
          exists: true,
          lastModified: new Date().toLocaleString(),
          size: file.size,
          sheetCount: data.sheetCount,
          sheets: data.sheets,
          status: 'success',
          message: 'Excel data file is loaded and ready to use'
        });
        setMessage({ 
          text: `Excel data uploaded successfully! ${data.sheetCount} sheets were detected. The AI will now use this data for analysis.`, 
          type: 'success' 
        });
      } else {
        setProfileStatus({
          exists: true,
          lastModified: new Date().toLocaleString(),
          size: file.size,
          status: 'success',
          message: 'Personality profile data is loaded and ready to use'
        });
        setMessage({ 
          text: `Personality profile data uploaded successfully! The AI will now use this data for analysis.`, 
          type: 'success' 
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-teal-800">Unified Data Uploader</CardTitle>
        <CardDescription>
          Upload personality profile data in various formats. The AI will use all available data sources when analyzing emails.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="excel">Excel Data</TabsTrigger>
            <TabsTrigger value="profile">Personality Profiles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <div className="p-4 rounded-md bg-white/70 backdrop-blur-sm border border-teal-100">
              <h3 className="text-sm font-medium text-teal-800 mb-2">Excel Data Status</h3>
              <div className="flex items-center space-x-2">
                {excelStatus.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                ) : excelStatus.status === 'success' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : excelStatus.status === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Database className="h-4 w-4 text-teal-600" />
                )}
                <span className="text-sm">{excelStatus.message}</span>
              </div>
              
              {excelStatus.exists && (
                <div className="mt-2 text-xs text-teal-700 pl-6">
                  <p>Last modified: {excelStatus.lastModified}</p>
                  <p>Size: {Math.round((excelStatus.size || 0) / 1024)} KB</p>
                  {excelStatus.sheetCount && (
                    <div>
                      <p>Sheets: {excelStatus.sheetCount}</p>
                      {excelStatus.sheets && excelStatus.sheets.length > 0 && (
                        <div className="mt-1 pl-2 border-l-2 border-teal-200">
                          {excelStatus.sheets.map((sheet, idx) => (
                            <p key={idx} className="text-xs text-teal-700">• {sheet}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
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
            <div className="p-4 rounded-md bg-white/70 backdrop-blur-sm border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Personality Profile Status</h3>
              <div className="flex items-center space-x-2">
                {profileStatus.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : profileStatus.status === 'success' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : profileStatus.status === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Database className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm">{profileStatus.message}</span>
              </div>
              
              {profileStatus.exists && (
                <div className="mt-2 text-xs text-blue-700 pl-6">
                  <p>Last modified: {profileStatus.lastModified}</p>
                  <p>Size: {Math.round((profileStatus.size || 0) / 1024)} KB</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border border-dashed border-blue-200 rounded-lg bg-white/50 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Personality Profile CSV</h3>
              <p className="text-xs text-gray-600 mb-3">
                Upload a CSV file containing personality profiles for email analysis. 
                The AI will use these profiles to analyze customer emails and provide personalized response suggestions.
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
                    className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
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
          <ul className="list-disc pl-5 space-y-1">
            <li>Excel: Upload multiple data sheets in a single file with any column headers</li>
            <li>CSV: Simple format for standard personality profile data</li>
            <li>AI will dynamically use all available data fields from both sources</li>
            <li>Perfect for companies with custom data structures</li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  );
}
