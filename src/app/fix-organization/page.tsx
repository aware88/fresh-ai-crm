'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FixOrganizationPage() {
  const [organizationName, setOrganizationName] = useState('Withcar');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('fix');

  const handleFix = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fix-user-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetOrganizationName: organizationName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fix organization');
      }
    } catch (err) {
      setError('An error occurred while fixing the organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: organizationName,
          description: description || `Organization created by user`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('An error occurred while creating the organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔧 Fix Organization Issue</CardTitle>
          <CardDescription>
            Fix your existing organization or create a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fix">Fix Existing</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fix" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name (e.g., Withcar)"
                />
              </div>

              <Button 
                onClick={handleFix} 
                disabled={loading || !organizationName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  'Fix Organization'
                )}
              </Button>

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>What this does:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Finds the organization by name</li>
                  <li>Adds you as a member with admin role</li>
                  <li>Updates your user preferences</li>
                  <li>Sets you as the owner</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newOrgName">Organization Name</Label>
                <Input
                  id="newOrgName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter new organization name (e.g., Withcar)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgDescription">Description (Optional)</Label>
                <Input
                  id="orgDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your organization"
                />
              </div>

              <Button 
                onClick={handleCreate} 
                disabled={loading || !organizationName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>What this does:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Creates a new organization</li>
                  <li>Adds you as admin and owner</li>
                  <li>Updates your user preferences</li>
                  <li>Sets up basic organization structure</li>
                </ul>
              </div>
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
                  <p><strong>Your Role:</strong> {result.userRole}</p>
                  <p><strong>Is Owner:</strong> {result.isOwner ? 'Yes' : 'No'}</p>
                </div>
                <div className="mt-3">
                  <Button 
                    onClick={() => window.location.href = '/settings/branding'} 
                    size="sm"
                  >
                    Go to Company Branding
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/debug/organizations'} 
              size="sm"
            >
              Debug: Check All Organizations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
