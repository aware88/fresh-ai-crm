'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from './files/FileUpload';
import { FileList } from './files/FileList';

interface FilesSectionProps {
  contactId: string;
  className?: string;
}

export function FilesSection({ contactId, className = '' }: FilesSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUpload 
          contactId={contactId} 
          onUploadSuccess={handleUploadSuccess} 
        />
        <FileList 
          key={refreshKey} 
          contactId={contactId} 
        />
      </CardContent>
    </Card>
  );
}
