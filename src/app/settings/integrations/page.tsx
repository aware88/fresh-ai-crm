'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Settings, Zap, Database } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect ARIS with external services and tools to enhance your workflow.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Available Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Available Integrations
            </CardTitle>
            <CardDescription>
              Connect with popular services to streamline your business operations.
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
                  <h4 className="font-medium">More Integrations</h4>
                  <p className="text-sm text-muted-foreground">
                    Slack, Teams, Zapier, and more coming soon
                  </p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* API Access */}
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
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Generate API Key
                </Button>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 