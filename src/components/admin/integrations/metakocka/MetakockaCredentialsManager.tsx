import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Edit, Trash, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

type Organization = {
  id: string;
  name: string;
};

type MetakockaCredential = {
  id: string;
  organization_id: string;
  company_id: string;
  secret_key: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'error';
  last_sync_at: string | null;
  organization: Organization;
};

export function MetakockaCredentialsManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [credentials, setCredentials] = useState<MetakockaCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState<Record<string, boolean>>({});
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentCredential, setCurrentCredential] = useState<Partial<MetakockaCredential>>({});
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [companyId, setCompanyId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  // Fetch organizations and credentials
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // In a real implementation, this would be an API call
        // For now, we'll simulate the data
        
        // Fetch organizations
        const orgData = await fetchOrganizations();
        setOrganizations(orgData);
        
        // Fetch credentials
        const credData = await fetchCredentials();
        setCredentials(credData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organizations and credentials',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Simulate fetching organizations
  async function fetchOrganizations() {
    // In a real implementation, this would be an API call
    return [
      { id: 'org1', name: 'Acme Inc.' },
      { id: 'org2', name: 'Globex Corporation' },
      { id: 'org3', name: 'Initech' },
    ];
  }
  
  // Simulate fetching credentials
  async function fetchCredentials() {
    // In a real implementation, this would be an API call
    return [
      {
        id: 'cred1',
        organization_id: 'org1',
        company_id: 'MK12345',
        secret_key: 'sk_test_abcdef123456',
        created_at: '2025-06-15T10:30:00Z',
        updated_at: '2025-06-15T10:30:00Z',
        status: 'active',
        last_sync_at: '2025-07-01T14:25:00Z',
        organization: { id: 'org1', name: 'Acme Inc.' },
      },
      {
        id: 'cred2',
        organization_id: 'org2',
        company_id: 'MK67890',
        secret_key: 'sk_test_ghijkl789012',
        created_at: '2025-06-20T09:15:00Z',
        updated_at: '2025-06-20T09:15:00Z',
        status: 'error',
        last_sync_at: '2025-06-30T08:45:00Z',
        organization: { id: 'org2', name: 'Globex Corporation' },
      },
    ] as MetakockaCredential[];
  }
  
  // Test connection
  const testConnection = async (credentialId: string) => {
    setTestingId(credentialId);
    
    try {
      // Simulate API call to test connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update credential status (in a real implementation, this would update the database)
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credentialId ? { ...cred, status: 'active' } : cred
        )
      );
      
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to Metakocka API',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Metakocka API. Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };
  
  // Open dialog to add new credential
  const openAddDialog = () => {
    setDialogMode('add');
    setCurrentCredential({});
    setSelectedOrgId('');
    setCompanyId('');
    setSecretKey('');
    setIsDialogOpen(true);
  };
  
  // Open dialog to edit credential
  const openEditDialog = (credential: MetakockaCredential) => {
    setDialogMode('edit');
    setCurrentCredential(credential);
    setSelectedOrgId(credential.organization_id);
    setCompanyId(credential.company_id);
    setSecretKey(credential.secret_key);
    setIsDialogOpen(true);
  };
  
  // Save credential
  const saveCredential = async () => {
    if (!selectedOrgId || !companyId || !secretKey) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // In a real implementation, this would be an API call to save the credential
      
      if (dialogMode === 'add') {
        // Simulate adding a new credential
        const newCredential: MetakockaCredential = {
          id: `cred${Date.now()}`,
          organization_id: selectedOrgId,
          company_id: companyId,
          secret_key: secretKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'inactive',
          last_sync_at: null,
          organization: organizations.find(org => org.id === selectedOrgId)!,
        };
        
        setCredentials(prev => [...prev, newCredential]);
        
        toast({
          title: 'Credential Added',
          description: 'Metakocka credential has been added successfully',
          variant: 'default',
        });
      } else {
        // Simulate updating an existing credential
        setCredentials(prev =>
          prev.map(cred =>
            cred.id === currentCredential.id
              ? {
                  ...cred,
                  organization_id: selectedOrgId,
                  company_id: companyId,
                  secret_key: secretKey,
                  updated_at: new Date().toISOString(),
                }
              : cred
          )
        );
        
        toast({
          title: 'Credential Updated',
          description: 'Metakocka credential has been updated successfully',
          variant: 'default',
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Metakocka credential',
        variant: 'destructive',
      });
    }
  };
  
  // Delete credential
  const deleteCredential = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }
    
    try {
      // In a real implementation, this would be an API call to delete the credential
      
      // Simulate deletion
      setCredentials(prev => prev.filter(cred => cred.id !== credentialId));
      
      toast({
        title: 'Credential Deleted',
        description: 'Metakocka credential has been deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete Metakocka credential',
        variant: 'destructive',
      });
    }
  };
  
  // Toggle secret key visibility
  const toggleSecretKeyVisibility = (credentialId: string) => {
    setShowSecretKey(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Loading credentials...</span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Metakocka Credentials</h2>
        <Button onClick={openAddDialog}>Add Credential</Button>
      </div>
      
      {credentials.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No Metakocka credentials found.</p>
          <Button variant="outline" className="mt-4" onClick={openAddDialog}>
            Add Your First Credential
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Company ID</TableHead>
                <TableHead>Secret Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>{credential.organization.name}</TableCell>
                  <TableCell>{credential.company_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {showSecretKey[credential.id] ? (
                        credential.secret_key
                      ) : (
                        '••••••••••••••••'
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSecretKeyVisibility(credential.id)}
                        className="ml-2"
                      >
                        {showSecretKey[credential.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(credential.status)}</TableCell>
                  <TableCell>{formatDate(credential.last_sync_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => testConnection(credential.id)}
                        disabled={testingId === credential.id}
                      >
                        {testingId === credential.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(credential)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteCredential(credential.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add/Edit Credential Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Add Metakocka Credential' : 'Edit Metakocka Credential'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <select
                id="organization"
                className="w-full p-2 border rounded-md"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <Input
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Enter Metakocka Company ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter Metakocka Secret Key"
                type="password"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCredential}>
              {dialogMode === 'add' ? 'Add Credential' : 'Update Credential'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
