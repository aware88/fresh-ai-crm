'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OrganizationDetails from './components/OrganizationDetails';
import OrganizationBranding from './components/OrganizationBranding';
import OrganizationFeatures from './components/OrganizationFeatures';
import OrganizationUsers from './components/OrganizationUsers';
import OrganizationSubscription from './components/OrganizationSubscription';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    custom_domain?: string;
  };
  feature_flags?: Record<string, boolean>;
  subscription?: {
    plan_name: string;
    status: string;
    current_period_end: string;
  };
  user_count?: number;
}

export default function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const organizationId = params.id;

  // Fetch organization data
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        
        const data = await response.json();
        setOrganization(data.organization);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOrganization();
  }, [organizationId]);

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
        <h1 className="text-2xl font-bold">{organization?.name}</h1>
        <div className="flex space-x-4">
          <Link
            href={`/admin/organizations/${organizationId}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit
          </Link>
          <Link
            href="/admin/organizations"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to List
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <h2 className="text-lg font-medium">Error</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'branding' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('branding')}
            >
              Branding
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'features' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'subscription' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('subscription')}
            >
              Subscription
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && organization && (
            <OrganizationDetails organization={organization} />
          )}

          {activeTab === 'branding' && organization && (
            <OrganizationBranding 
              organization={organization} 
              organizationId={organizationId} 
              setError={setError}
              setOrganization={setOrganization}
            />
          )}

          {activeTab === 'features' && organization && (
            <OrganizationFeatures 
              organization={organization} 
              organizationId={organizationId} 
              setError={setError}
              setOrganization={setOrganization}
            />
          )}

          {activeTab === 'users' && organization && (
            <OrganizationUsers 
              organization={organization} 
              organizationId={organizationId} 
            />
          )}

          {activeTab === 'subscription' && organization && (
            <OrganizationSubscription 
              organization={organization} 
              organizationId={organizationId} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
