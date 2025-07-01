import React, { useState, useRef } from 'react';
import { uploadSupplierDocument } from '@/lib/suppliers/documents-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentUploadProps {
  supplierId: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ supplierId, onUploadComplete }: DocumentUploadProps): React.ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadSuccess(false);
    }
  };

  // Handle document type selection
  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setError(null);
  };

  // Simulate upload progress
  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 5;
      });
    }, 100);
    return interval;
  };

  // Handle file upload
  const handleUpload = async () => {
    // Validate inputs
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);
    
    // Start progress simulation
    const progressInterval = simulateProgress();

    try {
      // Upload the file
      await uploadSupplierDocument(file, supplierId, documentType);
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show success message
      setUploadSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFile(null);
        setDocumentType('');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setError('Failed to upload document. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select Document</Label>
            <Input
              id="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.csv,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png"
              disabled={isUploading}
            />
            <p className="text-sm text-gray-500">
              Supported formats: PDF, CSV, Excel, Word, Images
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={handleDocumentTypeChange}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Price List">Price List</SelectItem>
                <SelectItem value="Catalog">Product Catalog</SelectItem>
                <SelectItem value="Specification">Product Specification</SelectItem>
                <SelectItem value="CoA">Certificate of Analysis</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>Document uploaded successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || !file || !documentType}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
