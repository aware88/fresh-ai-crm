'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, User, Key, Clock, Shield, Mail, UserCog, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import UserRoles from './components/UserRoles';
import UserActivity from './components/UserActivity';

interface UserDetails {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  status: string;
  organizations: { id: string; name: string }[];
  roles: { id: string; name: string; type: string }[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract user ID from params
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    
    async function fetchUserDetails() {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const data = await response.json();
        setUser(data.user || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserDetails();
  }, [userId]);

  function getStatusBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'invited':
        return 'bg-blue-100 text-blue-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send password reset');
      }
      
      alert('Password reset email sent successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSuspendUser = async () => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }
      
      // Refresh user data
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      router.push('/admin/users');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
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
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !user ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>User not found</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.email}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusBadgeColor(user.status)}>
                    {user.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {user.email}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleResetPassword}
                  className="flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  Reset Password
                </Button>
                {user.status !== 'Suspended' ? (
                  <Button 
                    variant="outline" 
                    onClick={handleSuspendUser}
                    className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                  >
                    <Shield className="h-4 w-4" />
                    Suspend
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleSuspendUser}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <Shield className="h-4 w-4" />
                    Reactivate
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteUser}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">User ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono">{user.id}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(user.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Last Login</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(user.last_sign_in_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Organizations</h2>
              {user.organizations.length === 0 ? (
                <p className="text-sm text-gray-500">User is not a member of any organization</p>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {user.organizations.map((org) => (
                      <li key={org.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {org.name}
                            </p>
                            <div className="ml-2 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/admin/organizations/${org.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Tabs defaultValue="roles" className="w-full">
              <TabsList>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Roles & Permissions
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Activity Log
                </TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="roles" className="mt-6">
                <UserRoles userId={userId} initialRoles={user.roles} />
              </TabsContent>
              
              <TabsContent value="activity" className="mt-6">
                <UserActivity userId={userId} />
              </TabsContent>
              
              <TabsContent value="emails" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email History</CardTitle>
                    <CardDescription>
                      View all emails sent to and from this user.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 text-center py-8">
                      Email history feature coming soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
