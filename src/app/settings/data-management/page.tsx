'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UnifiedDataUploader } from '@/components/settings/UnifiedDataUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DataManagementPage() {
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
        <h3 className="text-lg font-medium">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Upload and manage your data in various formats. The AI will use all available data sources when analyzing emails.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload Data</CardTitle>
          <CardDescription>
            Choose the format that works best for your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedDataUploader />
        </CardContent>
      </Card>
    </div>
  );
} 