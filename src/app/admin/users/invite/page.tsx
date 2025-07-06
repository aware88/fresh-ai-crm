'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Organization {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
}

export default function InviteUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch organizations and roles
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch organizations
        const orgResponse = await fetch('/api/admin/organizations');
        if (!orgResponse.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const orgData = await orgResponse.json();
        setOrganizations(orgData.organizations || []);

        // Fetch roles
        const roleResponse = await fetch('/api/admin/roles');
        if (!roleResponse.ok) {
          throw new Error('Failed to fetch roles');
        }
        const roleData = await roleResponse.json();
        setRoles(roleData.roles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
    
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    // Validate form
    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          organization_id: organizationId || undefined,
          role_id: roleId || undefined,
          send_welcome_email: sendWelcomeEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      setSuccess(true);
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setOrganizationId('');
      setRoleId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          
          <h1 className="text-xl font-semibold text-gray-900">Invite User</h1>
          <p className="mt-2 text-sm text-gray-700">
            Send an invitation to a new user to join the platform.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Invitation sent successfully! The user will receive an email with instructions to set up their account.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default User</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendWelcomeEmail"
                checked={sendWelcomeEmail}
                onCheckedChange={(checked) => setSendWelcomeEmail(checked === true)}
              />
              <Label htmlFor="sendWelcomeEmail" className="text-sm font-normal">
                Send welcome email with setup instructions
              </Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/users')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
