'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { FilesList } from '@/components/files/FilesList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploader } from '@/components/files/FileUploader';
import { FileMetadata } from '@/lib/files/types';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Upload } from 'lucide-react';

export default function FilesPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const handleUploadComplete = (file: FileMetadata) => {
    setShowUploadDialog(false);
    toast({
      title: 'File uploaded',
      description: `${file.originalName} has been uploaded successfully.`,
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Files Management</h1>
          <p className="text-gray-500">Upload, organize, and manage your files</p>
        </div>
        <Button 
          onClick={() => setShowUploadDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Upload className="h-4 w-4 mr-2" /> Upload File
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            All Files
          </CardTitle>
          <CardDescription>
            View and manage all files in your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilesList showUploader={false} />
        </CardContent>
      </Card>

      {/* Upload Dialog */}
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
    </div>
  );
}
