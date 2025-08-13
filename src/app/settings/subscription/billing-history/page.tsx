'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionInvoice } from '@/lib/services/subscription-service';

export default function BillingHistoryPage() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Get organization ID and user ID from session
    const getOrgId = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user) {
          const orgId = (session.user as any)?.organizationId;
          const userId = session.user.id;
          
          if (orgId) {
            setOrganizationId(orgId);
          } else if (userId) {
            // For individual users, use userId as identifier
            setOrganizationId(userId);
          } else {
            setError('No organization or user found. Please log in again.');
          }
        } else {
          setError('Please log in to view billing history.');
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load session. Please try again later.');
      }
    };

    getOrgId();
  }, []);

  useEffect(() => {
    if (!organizationId) return;

    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try both organizationId and userId parameters for compatibility
        const response = await fetch(`/api/subscription/invoices?organizationId=${organizationId}&userId=${organizationId}&limit=50`);
        if (!response.ok) throw new Error('Failed to load invoices');
        
        const data = await response.json();
        setInvoices(data.invoices || []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load billing history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [organizationId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800';
      case 'void':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Billing History</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Billing History</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Billing History</h1>
          <button 
            onClick={() => router.push('/settings/subscription')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Subscription
          </button>
        </div>
        
        {invoices.length > 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.invoice_pdf && (
                        <a 
                          href={invoice.invoice_pdf} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Download PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No billing history available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
