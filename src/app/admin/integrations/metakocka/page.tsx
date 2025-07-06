import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetakockaCredentialsManager } from '@/components/admin/integrations/metakocka/MetakockaCredentialsManager';
import { MetakockaSyncStatus } from '@/components/admin/integrations/metakocka/MetakockaSyncStatus';
import { MetakockaErrorLogs } from '@/components/admin/integrations/metakocka/MetakockaErrorLogs';

export const metadata = {
  title: 'Metakocka Integration - CRM Mind Admin',
};

export default function MetakockaIntegrationPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Metakocka Integration</h1>
        
        <Tabs defaultValue="credentials">
          <TabsList className="mb-4">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
            <TabsTrigger value="errors">Error Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle>Organization Credentials</CardTitle>
                <CardDescription>
                  Manage Metakocka API credentials for organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetakockaCredentialsManager />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
                <CardDescription>
                  Monitor synchronization status between CRM Mind and Metakocka.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetakockaSyncStatus />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Error Logs</CardTitle>
                <CardDescription>
                  View and manage Metakocka integration errors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetakockaErrorLogs />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>
                  Configure global settings for Metakocka integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sync Settings</h3>
                  {/* Sync settings form will go here */}
                  <p className="text-muted-foreground">Configure synchronization settings for all organizations.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
