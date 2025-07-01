'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { checkMetakockaCredentials, saveMetakockaCredentials, deleteMetakockaCredentials, testMetakockaConnection } from '@/lib/integrations/metakocka/client-api';

export default function MetakockaIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyId: '',
    secretKey: '',
    apiEndpoint: 'https://main.metakocka.si/rest/eshop/v1/json/',
  });
  
  // Load existing credentials on mount
  useEffect(() => {
    async function loadCredentials() {
      try {
        setLoading(true);
        const result = await checkMetakockaCredentials();
        
        if (result.exists) {
          setHasCredentials(true);
          setFormData({
            companyId: result.companyId || '',
            secretKey: '', // Secret key is never returned from the API
            apiEndpoint: result.apiEndpoint || 'https://main.metakocka.si/rest/eshop/v1/json/',
          });
        }
      } catch (err) {
        setError('Failed to load Metakocka credentials');
      } finally {
        setLoading(false);
      }
    }
    
    loadCredentials();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear any previous messages when the user makes changes
    setError(null);
    setSuccess(null);
  };
  
  const handleTestConnection = async () => {
    if (!formData.companyId || !formData.secretKey) {
      setError('Company ID and Secret Key are required');
      return;
    }
    
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      
      const result = await testMetakockaConnection(formData);
      
      if (result.success) {
        setSuccess('Connection successful! Your credentials are valid.');
      } else {
        setError(`Connection failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setTesting(false);
    }
  };
  
  const handleSaveCredentials = async () => {
    if (!formData.companyId || !formData.secretKey) {
      setError('Company ID and Secret Key are required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await saveMetakockaCredentials(formData, true);
      setSuccess('Credentials saved successfully!');
      setHasCredentials(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteCredentials = async () => {
    if (!confirm('Are you sure you want to delete your Metakocka credentials?')) {
      return;
    }
    
    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      
      await deleteMetakockaCredentials();
      setSuccess('Credentials deleted successfully!');
      setHasCredentials(false);
      setFormData({
        companyId: '',
        secretKey: '',
        apiEndpoint: 'https://main.metakocka.si/rest/eshop/v1/json/',
      });
    } catch (err) {
      setError('Failed to delete credentials');
    } finally {
      setDeleting(false);
    }
  };
  
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Metakocka Integration</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Metakocka API Credentials</CardTitle>
          <CardDescription>
            Connect your CRM to Metakocka ERP to sync products, contacts, and sales documents.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                placeholder="Your Metakocka Company ID"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                name="secretKey"
                type="password"
                value={formData.secretKey}
                onChange={handleInputChange}
                placeholder={hasCredentials ? "••••••••••••••••" : "Your Metakocka Secret Key"}
                required={!hasCredentials}
              />
              {hasCredentials && (
                <p className="text-sm text-gray-500">
                  Leave blank to keep your current secret key
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                id="apiEndpoint"
                name="apiEndpoint"
                value={formData.apiEndpoint}
                onChange={handleInputChange}
                placeholder="https://main.metakocka.si/rest/eshop/v1/json/"
              />
              <p className="text-sm text-gray-500">
                Default: https://main.metakocka.si/rest/eshop/v1/json/
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !formData.companyId || !formData.secretKey}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
          
          <div className="flex gap-2">
            {hasCredentials && (
              <Button
                variant="destructive"
                onClick={handleDeleteCredentials}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            
            <Button
              onClick={handleSaveCredentials}
              disabled={saving || !formData.companyId || (!formData.secretKey && !hasCredentials)}
            >
              {saving ? 'Saving...' : hasCredentials ? 'Update' : 'Save'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About Metakocka Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Integrating with Metakocka allows you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sync products between your CRM and Metakocka</li>
            <li>Create invoices and offers in Metakocka from your CRM</li>
            <li>Check real-time inventory levels</li>
            <li>Keep contacts synchronized between systems</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
