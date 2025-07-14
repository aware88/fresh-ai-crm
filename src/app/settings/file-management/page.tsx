'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { FilesSection } from '@/components/settings/FilesSection';
import { FilesList } from '@/components/files/FilesList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FileManagementPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/signin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">File Management</h3>
        <p className="text-sm text-muted-foreground">
          Upload, organize, and manage your files for easy access and sharing.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>
            Manage your uploaded files and documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FilesSection />
          <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
            <FilesList showUploader={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 