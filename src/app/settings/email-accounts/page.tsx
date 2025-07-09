import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default async function EmailAccountsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect('/api/auth/signin');
  }
  
  // Fetch user's email accounts
  const { data: emailAccounts, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching email accounts:', error);
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Accounts</h1>
        <div className="flex space-x-2">
          <Link 
            href="/settings/email-accounts/add-outlook"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Outlook Account
          </Link>
          <Link 
            href="/settings/email-accounts/add-imap"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add IMAP Account
          </Link>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Managing Email Accounts</h2>
        <p className="mb-4">
          Connect your email accounts to CRM Mind to access emails, contacts, and calendar events.
          You can connect both Microsoft Outlook accounts (using OAuth) and standard email accounts (using IMAP/SMTP).
        </p>
        <Link 
          href="/docs/email-account-setup-guide.md"
          className="text-blue-600 hover:underline"
          target="_blank"
        >
          View detailed setup guide
        </Link>
      </div>
      
      {/* Email Accounts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Address
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added On
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {emailAccounts && emailAccounts.length > 0 ? (
              emailAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{account.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.provider_type === 'outlook' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {account.provider_type === 'outlook' ? 'Microsoft Outlook' : 'IMAP/SMTP'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      account.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(account.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      href={`/settings/email-accounts/test/${account.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Test
                    </Link>
                    <Link 
                      href={`/settings/email-accounts/edit/${account.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Link 
                      href={`/settings/email-accounts/delete/${account.id}`}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No email accounts connected yet. Add an account to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
