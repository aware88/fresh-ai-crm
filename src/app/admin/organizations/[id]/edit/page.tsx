'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditOrganizationPage({ params }: PageProps) {
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string>('');
  const router = useRouter();

  // Extract organization ID from params
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setOrganizationId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  // Fetch organization data
  useEffect(() => {
    if (!organizationId) return;
    
    async function fetchOrganization() {
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        
        const data = await response.json();
        setOrganization(data.organization);
        setName(data.organization.name);
        setSlug(data.organization.slug);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOrganization();
  }, [organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, slug }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      router.push(`/admin/organizations/${organizationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <h2 className="text-lg font-medium">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Organization</h1>
        <div className="flex space-x-4">
          <Link
            href={`/admin/organizations/${organizationId}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <h2 className="text-lg font-medium">Error</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug (URL Identifier)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This will be used in URLs and API endpoints. Only lowercase letters, numbers, and hyphens are allowed.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
