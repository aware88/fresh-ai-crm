'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploader } from '@/components/files/FileUploader';
import { useToast } from '@/components/ui/use-toast';
import { FileMetadata } from '@/lib/files/types';

export function FilesSection() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = (file: FileMetadata) => {
    setShowUploadDialog(false);
    toast({
      title: 'File uploaded',
      description: `${file.original_name} has been uploaded successfully.`,
    });
  };

  return (
    <>
      <Button 
        onClick={() => setShowUploadDialog(true)}
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        <Upload className="h-4 w-4 mr-2" /> Upload File
      </Button>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <FileUploader 
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              toast({
                title: 'Upload failed',
                description: error,
                variant: 'destructive',
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
