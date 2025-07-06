'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
  subscription_status?: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/admin/organizations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOrganizations();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <h2 className="text-lg font-medium">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <button
          onClick={() => router.push('/admin/organizations/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          New Organization
        </button>
      </div>
      
      {organizations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No organizations found.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {org.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.user_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(org.subscription_status)}`}>
                      {org.subscription_status || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/organizations/${org.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      View
                    </Link>
                    <Link href={`/admin/organizations/${org.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getSubscriptionBadgeColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'trialing':
      return 'bg-blue-100 text-blue-800';
    case 'past_due':
      return 'bg-yellow-100 text-yellow-800';
    case 'canceled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
