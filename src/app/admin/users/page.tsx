'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search, UserPlus, Filter, Download } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  organization_name: string;
  last_login: string;
  status: string;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.organization_name.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

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

  function formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all users in the system including their email, role, organization, and status.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button 
              onClick={() => router.push('/admin/users/invite')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {isLoading ? (
            <div className="bg-white">
              <div className="px-4 py-5 sm:p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white px-4 py-5 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white px-4 py-5 sm:p-6 text-center text-gray-500">
              {searchQuery ? 'No users match your search criteria.' : 'No users found in the system.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Organization
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Login
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.role}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.organization_name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link 
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View<span className="sr-only">, {user.email}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
