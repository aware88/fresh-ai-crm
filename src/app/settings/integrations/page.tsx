'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { ExternalLink, Settings, Zap, Database, Mail, Webhook } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect ARIS with external services and tools to enhance your workflow.
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">
            <Zap className="h-4 w-4 mr-2" />
            Available
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api">
            <ExternalLink className="h-4 w-4 mr-2" />
            API Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Business Integrations
              </CardTitle>
              <CardDescription>
                Connect with ERP, CRM, and business management systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metakocka Integration */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Metakocka ERP</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync products, contacts, and orders with Metakocka ERP system
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Available</Badge>
                  <Link href="/settings/integrations/metakocka">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Salesforce Integration - Coming Soon */}
              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">SF</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Salesforce CRM</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync leads, opportunities, and customer data with Salesforce
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>

              {/* HubSpot Integration - Coming Soon */}
              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-orange-100 rounded flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">HS</span>
                  </div>
                  <div>
                    <h4 className="font-medium">HubSpot CRM</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect with HubSpot for marketing, sales, and service automation
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Communication Integrations
              </CardTitle>
              <CardDescription>
                Connect your email and messaging platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Integration */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-red-100 rounded flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">G</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Gmail & Outlook</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect your email accounts for AI-powered email management
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Available</Badge>
                  <Link href="/settings/email-accounts">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">+</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Slack & Teams</h4>
                    <p className="text-sm text-muted-foreground">
                      Team collaboration and notifications
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Set up webhooks to receive real-time notifications about events in your CRM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Webhooks allow you to receive HTTP callbacks when specific events occur in your CRM, 
                  such as new contacts, updated deals, or email interactions.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Webhooks
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    View Event Types
                  </Button>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                API Access
              </CardTitle>
              <CardDescription>
                Build custom integrations using the ARIS API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use our REST API to integrate ARIS with your custom applications and workflows.
                  Access contacts, deals, products, and more programmatically.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    API Documentation
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Generate API Key
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    View Rate Limits
                  </Button>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 