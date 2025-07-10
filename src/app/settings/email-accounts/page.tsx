import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function EmailAccountsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect('/api/auth/signin');
  }
  
  // Initialize supabase client
  let emailAccounts: any[] = [];
  let error: any = null;
  let tableExists = false;
  
  try {
    const supabase = await createServerClient();
    
    // Try to fetch user's email accounts
    try {
      // Try to query the table directly - if it doesn't exist, we'll get an error
      const { data, error: fetchError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        // Check if the error is because the table doesn't exist
        if (fetchError.code === '42P01') { // PostgreSQL code for undefined_table
          console.warn('Email accounts table does not exist yet');
          tableExists = false;
        } else {
          console.error('Error fetching email accounts:', fetchError);
          error = fetchError;
        }
      } else {
        tableExists = true;
        emailAccounts = data || [];
      }
    } catch (e) {
      console.error('Error with database query:', e);
      error = {
        message: e instanceof Error ? e.message : 'Error querying the database',
        details: e
      };
    }
  } catch (e) {
    console.error('Error with database connection:', e);
    error = {
      message: e instanceof Error ? e.message : 'Error connecting to the database',
      details: e
    };
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
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error && typeof error === 'object' && 'message' in error ? error.message : 'An error occurred while fetching email accounts.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!tableExists && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Email accounts table not found.</strong> You need to create the <code>email_accounts</code> table in your Supabase database.
              </p>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="font-medium">To create the table:</p>
                <ol className="list-decimal pl-5 mt-1 space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Run the SQL provided below</li>
                </ol>
                <p className="mt-2">After creating the table, refresh this page.</p>
              </div>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {`CREATE TABLE IF NOT EXISTS public.email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  organization_id UUID,
  provider_type TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  password TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_security TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_security TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email accounts"
  ON public.email_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email accounts"
  ON public.email_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts"
  ON public.email_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email accounts"
  ON public.email_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX email_accounts_user_id_idx ON public.email_accounts (user_id);
CREATE INDEX email_accounts_organization_id_idx ON public.email_accounts (organization_id);
CREATE INDEX email_accounts_email_idx ON public.email_accounts (email);`}
              </pre>
            </div>
          </div>
        </div>
      )}
      
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
      {tableExists && (
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
      )}
    </div>
  );
}
