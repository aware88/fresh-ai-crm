'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUploader from './FileUploader';
import { FilesList } from './FilesList';

interface FilesSectionProps {
  contactId: string;
  className?: string;
}

const FilesSection: React.FC<FilesSectionProps> = ({ contactId, className = '' }) => {
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
        <FileUploader 
          contactId={contactId} 
          onUploadSuccess={handleUploadSuccess} 
        />
        <FilesList 
          key={refreshKey} 
          contactId={contactId} 
        />
      </CardContent>
    </Card>
  );
};

export default FilesSection;
