'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, Upload, AlertCircle, FileText } from 'lucide-react';

interface FileStatus {
  exists: boolean;
  lastModified?: string;
  size?: number;
  message: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export function MockDataUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileStatus, setFileStatus] = useState<FileStatus>({
    exists: false,
    status: 'loading',
    message: 'Checking for existing mock data...'
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Check if mock data file exists on component mount
  useEffect(() => {
    const checkMockDataFile = async () => {
      try {
        const response = await fetch('/api/check-mock-data');
        const data = await response.json();
        
        if (data.exists) {
          setFileStatus({
            exists: true,
            lastModified: data.lastModified,
            size: data.size,
            status: 'success',
            message: 'Mock data file is loaded and ready to use'
          });
        } else {
          setFileStatus({
            exists: false,
            status: 'idle',
            message: 'No mock data file found. Please upload a CSV file.'
          });
        }
      } catch (error) {
        console.error('Error checking mock data file:', error);
        setFileStatus({
          exists: false,
          status: 'error',
          message: 'Error checking mock data file'
        });
      }
    };

    checkMockDataFile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Accept any file type but check extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv') {
        setFile(selectedFile);
        setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
      } else {
        setFile(null);
        setMessage({ text: 'Please select a CSV file (.csv extension)', type: 'error' });
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

      // Send the file to the server
      const response = await fetch('/api/upload-mock-data', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update file status after successful upload
      setFileStatus({
        exists: true,
        lastModified: new Date().toLocaleString(),
        size: file.size,
        status: 'success',
        message: 'Mock data file is loaded and ready to use'
      });

      setMessage({ text: 'Mock data uploaded successfully! The AI will now use this data for analysis.', type: 'success' });
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-indigo-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <FileText size={18} />
          Mock Data Uploader
        </CardTitle>
        <CardDescription>
          We'll create realistic sample data to help you test the system.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current File Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-indigo-800">Current Status</h3>
          <div className={`p-4 rounded-md ${
            fileStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
            fileStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
            fileStatus.status === 'loading' ? 'bg-blue-50 border border-blue-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center">
              {fileStatus.status === 'loading' && <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />}
              {fileStatus.status === 'success' && <Check className="h-4 w-4 mr-2 text-green-600" />}
              {fileStatus.status === 'error' && <AlertCircle className="h-4 w-4 mr-2 text-red-600" />}
              <span className={`text-sm ${
                fileStatus.status === 'success' ? 'text-green-700' :
                fileStatus.status === 'error' ? 'text-red-700' :
                fileStatus.status === 'loading' ? 'text-blue-700' :
                'text-gray-700'
              }`}>
                {fileStatus.message}
              </span>
            </div>
            {fileStatus.exists && (
              <div className="mt-2 text-xs text-gray-600">
                <p>Last modified: {fileStatus.lastModified}</p>
                <p>Size: {Math.round((fileStatus.size || 0) / 1024)} KB</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload New File */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-indigo-800">Upload New Mock Data</h3>
          <div className="p-4 border border-dashed border-indigo-200 rounded-lg bg-white/50 backdrop-blur-sm">
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
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  disabled={isUploading}
                />
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || isUploading}
                  className="whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV
                    </>
                  )}
                </Button>
              </div>
              
              {file && (
                <div className="text-sm text-indigo-700 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                </div>
              )}
            </div>
          </div>
        </div>

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
      
      <CardFooter className="bg-white/50 backdrop-blur-sm border-t border-indigo-100 px-6 py-4">
        <div className="w-full text-xs text-gray-600">
          <p className="font-medium mb-1">CSV Format Requirements:</p>
          <p>Your mock data CSV should follow the same format as the personality profiles CSV.</p>
          <p className="mt-1">The AI will use both the primary personality profiles and this mock data for analysis.</p>
        </div>
      </CardFooter>
    </Card>
  );
}
