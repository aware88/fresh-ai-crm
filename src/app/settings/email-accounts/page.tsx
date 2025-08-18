'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

function EmailAccountsContent() {
  const { data: session, status, isLoading } = useOptimizedAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [tableExists, setTableExists] = useState(true); // Default to true to prevent flash
  const [tableChecked, setTableChecked] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    totalSaved: number;
    breakdown: { inbox: number; sent: number };
    syncedAt: string;
    error?: string;
  } | null>(null);
  const { toast } = useToast();
  // Handle OAuth callback messages
  useEffect(() => {
    if (searchParams) {
      const success = searchParams.get('success');
      const errorParam = searchParams.get('error');
      
      if (success === 'true') {
        const provider = searchParams.get('provider');
        const providerName = provider === 'google' ? 'Google Gmail' : 
                           provider === 'microsoft' ? 'Microsoft Outlook' : 'Email';
        setOauthMessage({ type: 'success', message: `${providerName} account connected successfully!` });
        // Clear the URL parameters
        router.replace('/settings/email-accounts');
      } else if (errorParam) {
        setOauthMessage({ type: 'error', message: `OAuth error: ${errorParam}` });
        // Clear the URL parameters
        router.replace('/settings/email-accounts');
      }
    }
  }, [searchParams, router]);

  // Handle authentication redirect - only for truly unauthenticated users
  // Use isLoading to prevent premature redirects during auth loading
  useEffect(() => {
    if (status === 'unauthenticated' && !session && !isLoading) {
      console.log('Redirecting to signin - user not authenticated');
      router.push('/signin');
    }
  }, [status, session, isLoading, router]);

  // Fetch email accounts when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user && 'id' in session.user && session.user.id) {
      console.log('Email Settings - Authenticated with user ID:', session.user.id);
      fetchEmailAccounts();
    } else if (status === 'authenticated') {
      console.log('Email Settings - Session exists but no user ID found');
    }
  }, [status, session]);

  const handleSyncEmails = async (accountId: string) => {
    setSyncingAccounts(prev => new Set([...prev, accountId]));
    
    try {
      const response = await fetch('/api/email/sync-to-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          maxEmails: 5000
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSyncResult({
          success: true,
          totalSaved: result.totalSaved,
          breakdown: result.breakdown,
          syncedAt: result.syncedAt
        });
        // Refresh the accounts list to show updated sync time
        fetchEmailAccounts();
      } else {
        setSyncResult({
          success: false,
          totalSaved: 0,
          breakdown: { inbox: 0, sent: 0 },
          syncedAt: new Date().toISOString(),
          error: result.error || 'Failed to sync emails'
        });
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      setSyncResult({
        success: false,
        totalSaved: 0,
        breakdown: { inbox: 0, sent: 0 },
        syncedAt: new Date().toISOString(),
        error: "An error occurred while syncing emails"
      });
    } finally {
      setSyncingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };
  
  const fetchEmailAccounts = async () => {
    if (!session?.user || !('id' in session.user) || !session.user.id) return;
    
    try {
      setLoading(true);
      const supabase = createClientComponentClient();
      
      try {
        console.log('🔍 Email Accounts: Fetching for user:', (session.user as any).id);
        
        // Try to get user's organization first
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', (session.user as any).id)
          .single();
        
        const organizationId = preferences?.current_organization_id;
        console.log('   User organization:', organizationId);
        
        // Query email accounts - try both user_id and organization_id
        let data, fetchError;
        
        // First try direct API call for more permissions
        try {
          console.log('   Trying direct API call first...');
          const response = await fetch('/api/email/accounts');
          if (response.ok) {
            const apiResult = await response.json();
            if (apiResult.accounts && apiResult.accounts.length > 0) {
              console.log('   Found', apiResult.accounts.length, 'accounts via API');
              data = apiResult.accounts;
              fetchError = null;
            }
          }
        } catch (apiError) {
          console.error('   API call failed:', apiError);
        }
        
        // If API call didn't work, try Supabase directly
        if (!data || data.length === 0) {
          if (organizationId) {
            // For users with organizations, try organization-scoped first
            console.log('   Trying organization-scoped email accounts...');
            const orgResult = await supabase
              .from('email_accounts')
              .select('*')
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false });
            
            if (orgResult.data && orgResult.data.length > 0) {
              data = orgResult.data;
              fetchError = orgResult.error;
              console.log('   Found', data.length, 'organization email accounts');
            } else {
              // Fallback to user-scoped
              console.log('   No org accounts, trying user-scoped...');
              const userResult = await supabase
                .from('email_accounts')
                .select('*')
                .eq('user_id', (session.user as any).id)
                .order('created_at', { ascending: false });
              
              data = userResult.data;
              fetchError = userResult.error;
              console.log('   Found', data?.length || 0, 'user email accounts');
            }
          } else {
            // For users without organizations, use user_id
            console.log('   No organization, trying user-scoped only...');
            const userResult = await supabase
              .from('email_accounts')
              .select('*')
              .eq('user_id', (session.user as any).id)
              .order('created_at', { ascending: false });
            
            data = userResult.data;
            fetchError = userResult.error;
            console.log('   Found', data?.length || 0, 'user email accounts');
          }
        }
        
        if (fetchError) {
          // Check if the error is because the table doesn't exist
          if (fetchError.code === '42P01') { // PostgreSQL code for undefined_table
            console.warn('Email accounts table does not exist yet');
            setTableExists(false);
            setTableChecked(true);
          } else {
            console.error('Error fetching email accounts:', fetchError);
            setError(fetchError);
            setTableChecked(true);
          }
        } else {
          setTableExists(true);
          setTableChecked(true);
          setEmailAccounts(data || []);
        }
      } catch (e) {
        console.error('Error with database query:', e);
        setError({
          message: e instanceof Error ? e.message : 'Error querying the database',
          details: e
        });
        setTableChecked(true);
      }
    } catch (e) {
      console.error('Error with database connection:', e);
      setError({
        message: e instanceof Error ? e.message : 'Error connecting to the database',
        details: e
      });
      setTableChecked(true);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email settings...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !session && !isLoading) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Connect Your Email Accounts</h3>
        <p className="text-gray-600 mt-2">
          Connect your email accounts to start managing and analyzing your emails with AI. Choose from Gmail, Outlook, or any IMAP-compatible email provider.
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Email Providers</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              window.location.href = '/api/auth/google/connect';
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Add Gmail Account
          </button>
          <button 
            onClick={() => {
              window.location.href = '/api/auth/outlook/connect';
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Outlook Account
          </button>
          <Link 
            href="/settings/email-accounts/add-imap"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add IMAP Account
          </Link>
        </div>
              </div>
      
      {oauthMessage && (
        <div className={`border-l-4 p-4 mb-6 ${
          oauthMessage.type === 'success' 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {oauthMessage.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${
                oauthMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {oauthMessage.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setOauthMessage(null)}
                className={`inline-flex rounded-md p-1.5 ${
                  oauthMessage.type === 'success' 
                    ? 'text-green-500 hover:bg-green-100' 
                    : 'text-red-500 hover:bg-red-100'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
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
      
      {!tableExists && tableChecked && (
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
  display_name TEXT,
  username TEXT,
  password TEXT,
  password_encrypted TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_security TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_security TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
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
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-2">Managing Email Accounts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your email accounts to ARIS to access emails, contacts, and calendar events. You can 
          connect both Microsoft Outlook accounts (using OAuth) and standard email accounts (using IMAP/SMTP).
        </p>
        
        {/* Gmail IMAP Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">📧 Gmail Setup (IMAP)</h4>
          <p className="text-sm text-blue-800 mb-3">
            While our Gmail OAuth is under Google verification, you can connect Gmail using IMAP:
          </p>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>1.</strong> Enable 2-Factor Authentication on your Gmail account</p>
            <p><strong>2.</strong> Generate an App Password: Google Account → Security → App Passwords</p>
            <p><strong>3.</strong> Use these IMAP settings:</p>
            <div className="bg-blue-100 rounded p-2 mt-2 font-mono text-xs">
              <div>Server: imap.gmail.com</div>
              <div>Port: 993</div>
              <div>Security: SSL/TLS</div>
              <div>Username: your-email@gmail.com</div>
              <div>Password: [App Password - not your regular password]</div>
            </div>
          </div>
        </div>
        
        <Link 
          href="/docs/email-account-setup-guide.md"
          className="text-blue-600 hover:underline text-sm"
          target="_blank"
        >
          View detailed setup guide
        </Link>
      </div>
      
      {/* Connected Email Accounts */}
      {tableExists && tableChecked && (
        <div className="space-y-4">
          {/* Sync Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📧 Email Sync</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>What does sync do?</strong> Downloads your recent emails (up to 5,000) from your email server to our database for AI learning.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="bg-white p-3 rounded border">
                  <p><strong>📥 Inbox:</strong> Up to 2,500 received emails</p>
                  <p><strong>📤 Sent:</strong> Up to 2,500 sent emails</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p><strong>🔒 Safe:</strong> Only you can see your emails</p>
                  <p><strong>⚡ Smart:</strong> Skips already synced emails</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Tip:</strong> Sync once, then use Email Learning to analyze patterns and improve AI responses.
              </p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold">Connected Email Accounts</h2>
          <div className="bg-card rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Provider Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Added On
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Sync
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {emailAccounts && emailAccounts.length > 0 ? (
                emailAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{account.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        account.provider_type === 'outlook' || account.provider_type === 'microsoft'
                          ? 'bg-blue-100 text-blue-800' 
                          : account.provider_type === 'google'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {account.provider_type === 'outlook' || account.provider_type === 'microsoft'
                          ? 'Microsoft Outlook' 
                          : account.provider_type === 'google'
                          ? 'Google Gmail'
                          : 'IMAP/SMTP'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        account.is_active !== false  // Treat undefined/null as active too
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.last_sync_at ? (
                        <div>
                          <div className="text-green-600 font-medium">
                            {new Date(account.last_sync_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(account.last_sync_at).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Never synced</span>
                      )}
                      {account.sync_error && (
                        <div className="text-red-500 text-xs mt-1" title={account.sync_error}>
                          ⚠️ Sync error
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSyncEmails(account.id)}
                        disabled={syncingAccounts.has(account.id)}
                        className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {syncingAccounts.has(account.id) ? 'Syncing...' : 'Sync'}
                      </button>
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
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">
                    No email accounts connected yet. Add an account to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Sync Result Modal */}
      {syncResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              {syncResult.success ? (
                <>
                  <div className="text-green-500 text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    Sync Successful!
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>{syncResult.totalSaved} total emails</strong> synced to database</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p>📥 Inbox: {syncResult.breakdown.inbox} emails</p>
                      <p>📤 Sent: {syncResult.breakdown.sent} emails</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Synced at: {new Date(syncResult.syncedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                    <p><strong>💡 Next Step:</strong> Go to Email Learning settings to analyze these emails and improve your AI responses!</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-red-500 text-6xl mb-4">❌</div>
                  <h3 className="text-xl font-semibold text-red-700 mb-2">
                    Sync Failed
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {syncResult.error}
                  </p>
                  <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
                    <p><strong>💡 Tip:</strong> Check your email credentials and try again. Some email providers require app-specific passwords.</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSyncResult(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
              {syncResult.success && (
                <button
                  onClick={() => {
                    setSyncResult(null);
                    router.push('/settings/learning');
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Go to Learning →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailAccountsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading email settings...</div>}>
      <EmailAccountsContent />
    </Suspense>
  );
}
