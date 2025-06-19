'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FileUploadProps {
  contactId: string;
  onUploadSuccess?: () => void;
  className?: string;
}

export function FileUpload({ contactId, onUploadSuccess, className = '' }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !contactId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('contactId', contactId);

    setIsUploading(true);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
        variant: 'default',
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file">Upload a file</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="file"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={isUploading}
          />
          {selectedFile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>
      
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </>
        )}
      </Button>
    </div>
  );
}
