'use client';

import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { FilesSection } from '@/components/settings/FilesSection';
import { FilesList } from '@/components/files/FilesList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FileManagementPage() {
  const { data: session, status } = useOptimizedAuth();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !session) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access file management.</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => window.location.href = '/signin'} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
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