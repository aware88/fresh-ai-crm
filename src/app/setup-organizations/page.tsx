'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Plus, Shield, Database, Code, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function SetupOrganizationsPage() {
  const [withcarAdmins, setWithcarAdmins] = useState('tim.mak88@gmail.com, zarfin.jakupovic@withcar.si');
  const [bulkNutritionAdmins, setBulkNutritionAdmins] = useState('tim.mak@bulknutrition.eu');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('withcar');
  const [rlsLoading, setRlsLoading] = useState(false);
  const [rlsResult, setRlsResult] = useState<any>(null);
  const [rlsError, setRlsError] = useState<string | null>(null);
  const [dbFuncLoading, setDbFuncLoading] = useState(false);
  const [dbFuncResult, setDbFuncResult] = useState<any>(null);
  const [dbFuncError, setDbFuncError] = useState<string | null>(null);

  const handleCreateWithcar = async () => {
    await handleCreateOrg('Withcar', 'Car dealership management system', withcarAdmins);
  };

  const handleCreateBulkNutrition = async () => {
    await handleCreateOrg('Bulk Nutrition', 'Nutrition supplement company', bulkNutritionAdmins);
  };

  const handleCreateOrg = async (name: string, description: string, adminsString: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const adminEmails = adminsString
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      const response = await fetch('/api/create-organization-with-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          adminEmails
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || `Failed to create organization ${name}`);
      }
    } catch (err) {
      setError(`An error occurred while creating the organization ${name}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFixRlsPolicies = async () => {
    setRlsLoading(true);
    setRlsError(null);
    setRlsResult(null);

    try {
      const response = await fetch('/api/fix-rls-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setRlsResult(data);
      } else {
        setRlsError(data.error || 'Failed to fix RLS policies');
      }
    } catch (err) {
      setRlsError('An error occurred while fixing RLS policies');
    } finally {
      setRlsLoading(false);
    }
  };
  
  const handleSetupDatabaseFunctions = async () => {
    setDbFuncLoading(true);
    setDbFuncError(null);
    setDbFuncResult(null);

    try {
      const response = await fetch('/api/setup-database-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setDbFuncResult(data);
      } else {
        setDbFuncError(data.error || 'Failed to setup database functions');
      }
    } catch (err) {
      setDbFuncError('An error occurred while setting up database functions');
    } finally {
      setDbFuncLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Organization Setup & Security</h1>
      
      <div className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Create Organizations
            </CardTitle>
            <CardDescription>
              Set up both organizations with the correct admin users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="withcar">Withcar</TabsTrigger>
                <TabsTrigger value="bulknutrition">Bulk Nutrition</TabsTrigger>
              </TabsList>
              
              <TabsContent value="withcar" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withcarAdmins">Admin Emails (comma-separated)</Label>
                  <Textarea
                    id="withcarAdmins"
                    value={withcarAdmins}
                    onChange={(e) => setWithcarAdmins(e.target.value)}
                    placeholder="Enter admin emails (e.g., admin1@example.com, admin2@example.com)"
                    className="min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleCreateWithcar} 
                  disabled={loading || !withcarAdmins.trim()}
                  className="w-full"
                >
                  {loading && activeTab === 'withcar' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create/Update Withcar Organization
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="bulknutrition" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkNutritionAdmins">Admin Emails (comma-separated)</Label>
                  <Textarea
                    id="bulkNutritionAdmins"
                    value={bulkNutritionAdmins}
                    onChange={(e) => setBulkNutritionAdmins(e.target.value)}
                    placeholder="Enter admin emails (e.g., admin@example.com)"
                    className="min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleCreateBulkNutrition} 
                  disabled={loading || !bulkNutritionAdmins.trim()}
                  className="w-full"
                >
                  {loading && activeTab === 'bulknutrition' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create/Update Bulk Nutrition Organization
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Success!</strong> {result.message}</p>
                    <p><strong>Organization:</strong> {result.organization.name}</p>
                    <p><strong>Added Admins:</strong> {result.addedAdmins?.length || 0}</p>
                    {result.missingAdmins?.length > 0 && (
                      <p><strong>Missing Admins:</strong> {result.missingAdmins.map(a => a.email).join(', ')}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Fix Data Security & Isolation
            </CardTitle>
            <CardDescription>
              Fix Row Level Security (RLS) policies to ensure proper data isolation between organizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2 mb-4">
              <p>This will update RLS policies for all key tables to ensure:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Users can only see their own email accounts</li>
                <li>Users can only see emails from their own accounts</li>
                <li>Users can only see contacts from their organization</li>
                <li>Users can only see products from their organization</li>
                <li>Users can only see suppliers from their organization</li>
              </ul>
            </div>

            <Button 
              onClick={handleFixRlsPolicies} 
              disabled={rlsLoading}
              className="w-full"
            >
              {rlsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing RLS Policies...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Fix RLS Policies
                </>
              )}
            </Button>

            {rlsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{rlsError}</AlertDescription>
              </Alert>
            )}

            {rlsResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Success!</strong> {rlsResult.message}</p>
                    <p>RLS policies have been updated for all key tables.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="mr-2 h-5 w-5" />
              Setup Database Functions
            </CardTitle>
            <CardDescription>
              Create necessary database functions for RLS policy management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2 mb-4">
              <p>This will create the following database functions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>check_table_exists</code> - Check if a table exists</li>
                <li><code>check_rls_enabled</code> - Check if RLS is enabled on a table</li>
                <li><code>get_policies_for_table</code> - Get all policies for a table</li>
                <li><code>execute_sql</code> - Execute SQL statements</li>
              </ul>
            </div>

            <Button 
              onClick={handleSetupDatabaseFunctions} 
              disabled={dbFuncLoading}
              className="w-full"
            >
              {dbFuncLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up Functions...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Setup Database Functions
                </>
              )}
            </Button>

            {dbFuncError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{dbFuncError}</AlertDescription>
              </Alert>
            )}

            {dbFuncResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Success!</strong> {dbFuncResult.message}</p>
                    <p>Database functions have been set up successfully.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/debug/users'} 
            size="sm"
          >
            Debug: Check Users
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/debug/organizations'} 
            size="sm"
          >
            Debug: Check Organizations
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/debug/rls-policies'} 
            size="sm"
          >
            Debug: Check RLS Policies
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/debug/email-accounts'} 
            size="sm"
          >
            Debug: Check Email Accounts
          </Button>
        </div>
      </div>
    </div>
  );
}
