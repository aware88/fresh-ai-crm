'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

function EmailAccountsContent() {
  const { data: session, status, isLoading } = useOptimizedAuth();
  const { subscription } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [tableExists, setTableExists] = useState(true);
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

  // Get subscription limits from context instead of API call
  const subscriptionLimits = subscription ? {
    emailAccountLimit: subscription.limits.emailAccounts,
    currentCount: emailAccounts.length, // Current count from loaded accounts
    canAdd: subscription.limits.emailAccounts === -1 || emailAccounts.length < subscription.limits.emailAccounts,
    planName: subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
  } : null;

  useEffect(() => {
    if (searchParams) {
      const success = searchParams.get('success');
      const errorParam = searchParams.get('error');
      
      if (success === 'true') {
        const provider = searchParams.get('provider');
        const providerName = provider === 'google' ? 'Google Gmail' : 
                           provider === 'microsoft' ? 'Microsoft Outlook' : 'Email';
        setOauthMessage({ type: 'success', message: `${providerName} account connected successfully!` });
        router.replace('/settings/email-accounts');
      } else if (errorParam) {
        setOauthMessage({ type: 'error', message: `OAuth error: ${errorParam}` });
        router.replace('/settings/email-accounts');
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (status === 'unauthenticated' && !session && !isLoading) {
      router.push('/signin');
    }
  }, [status, session, isLoading, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && 'id' in session.user && session.user.id) {
      fetchEmailAccounts();
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

  const handleGraphImport = async (accountId: string, folder: string = 'inbox') => {
    setSyncingAccounts(prev => new Set([...prev, accountId]));

    try {
      const response = await fetch('/api/emails/graph/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId, folder, maxEmails: 5000 }),
      });

      const result = await response.json();

      if (result.success) {
        setSyncResult({
          success: true,
          totalSaved: result.totalSaved,
          breakdown: result.breakdown || { inbox: result.totalSaved },
          syncedAt: result.syncedAt
        });
        fetchEmailAccounts();
      } else {
        setSyncResult({
          success: false,
          totalSaved: 0,
          breakdown: { inbox: 0, sent: 0 },
          syncedAt: new Date().toISOString(),
          error: result.error || 'Failed to import from Microsoft'
        });
      }
    } catch (error) {
      console.error('Error importing emails from Microsoft:', error);
      setSyncResult({
        success: false,
        totalSaved: 0,
        breakdown: { inbox: 0, sent: 0 },
        syncedAt: new Date().toISOString(),
        error: 'An error occurred while importing emails'
      });
    } finally {
      setSyncingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const handleGmailImport = async (accountId: string, folder: string = 'inbox') => {
    setSyncingAccounts(prev => new Set([...prev, accountId]));
    try {
      const response = await fetch('/api/emails/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, folder, maxEmails: 5000 }),
      });
      const result = await response.json();
      if (result.success) {
        setSyncResult({
          success: true,
          totalSaved: result.totalSaved,
          breakdown: result.breakdown,
          syncedAt: result.syncedAt,
        });
        fetchEmailAccounts();
      } else {
        setSyncResult({
          success: false,
          totalSaved: 0,
          breakdown: { inbox: 0, sent: 0 },
          syncedAt: new Date().toISOString(),
          error: result.error || 'Failed to import from Gmail',
        });
      }
    } catch (error) {
      console.error('Error importing emails from Gmail:', error);
      setSyncResult({
        success: false,
        totalSaved: 0,
        breakdown: { inbox: 0, sent: 0 },
        syncedAt: new Date().toISOString(),
        error: 'An error occurred while importing emails',
      });
    } finally {
      setSyncingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const handleRunLearning = async () => {
    try {
      const resp = await fetch('/api/email/learning/process-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxEmails: 1000, daysBack: 120 }),
      });
      const result = await resp.json();
      if ((resp as any).ok) {
        toast({ title: 'Learning started', description: `Analyzing ${result.results?.totalEmails ?? 'selected'} emails` });
      } else {
        toast({ title: 'Learning error', description: result.error || 'Failed to start learning' });
      }
    } catch (e) {
      toast({ title: 'Learning error', description: 'Network or server error' });
    }
  };

  const handleCatchUpSync = async (accountId: string, syncDays: number = 30) => {
    setSyncingAccounts(prev => new Set([...prev, accountId]));
    
    try {
      toast({ 
        title: 'Starting catch-up sync...', 
        description: `Syncing last ${syncDays} days of emails and running AI learning` 
      });

      const response = await fetch('/api/email/catch-up-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          syncDays,
          runAILearning: true
        })
      });

      const result = await response.json();

      if (result.success) {
        const newEmails = result.results.emails.new_emails;
        const recommendations = result.recommendations?.join(' ') || 'Catch-up sync completed successfully.';
        
        toast({
          title: 'Catch-up sync completed!',
          description: `Found ${newEmails} new emails. ${recommendations}`,
        });

        setSyncResult({
          success: true,
          totalSaved: newEmails,
          breakdown: { inbox: newEmails, sent: 0 },
          syncedAt: new Date().toISOString()
        });
        
        fetchEmailAccounts();
      } else {
        toast({
          title: 'Catch-up sync failed',
          description: result.error || 'An error occurred during catch-up sync',
        });

        setSyncResult({
          success: false,
          totalSaved: 0,
          breakdown: { inbox: 0, sent: 0 },
          syncedAt: new Date().toISOString(),
          error: result.error || 'Catch-up sync failed'
        });
      }
    } catch (error) {
      console.error('Error during catch-up sync:', error);
      toast({
        title: 'Catch-up sync failed',
        description: 'Network or server error during catch-up sync',
      });

      setSyncResult({
        success: false,
        totalSaved: 0,
        breakdown: { inbox: 0, sent: 0 },
        syncedAt: new Date().toISOString(),
        error: "Network or server error during catch-up sync"
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
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('current_organization_id')
          .eq('user_id', (session.user as any).id)
          .single();
        
        const organizationId = preferences?.current_organization_id;
        let data, fetchError;
        
        try {
          const response = await fetch('/api/email/accounts');
          if (response.ok) {
            const apiResult = await response.json();
            if (apiResult.accounts && apiResult.accounts.length > 0) {
              data = apiResult.accounts;
              fetchError = null;
            }
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
        }
        
        if (!data || data.length === 0) {
          if (organizationId) {
            const orgResult = await supabase
              .from('email_accounts')
              .select('*')
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false });
            
            if (orgResult.data && orgResult.data.length > 0) {
              data = orgResult.data;
              fetchError = orgResult.error;
            } else {
              const userResult = await supabase
                .from('email_accounts')
                .select('*')
                .eq('user_id', (session.user as any).id)
                .order('created_at', { ascending: false });
              
              data = userResult.data;
              fetchError = userResult.error;
            }
          } else {
            const userResult = await supabase
              .from('email_accounts')
              .select('*')
              .eq('user_id', (session.user as any).id)
              .order('created_at', { ascending: false });
            
            data = userResult.data;
            fetchError = userResult.error;
          }
        }
        
        if (fetchError) {
          if (fetchError.code === '42P01') {
            setTableExists(false);
            setTableChecked(true);
          } else {
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
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Connect Your Email Accounts</h3>
            <p className="text-gray-600 mt-2">
              Connect your email accounts to start managing and analyzing your emails with AI. Choose from Gmail, Outlook, or any IMAP-compatible email provider.
            </p>
          </div>
          
          {subscriptionLimits && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 min-w-[200px]">
              <div className="text-center">
                <div className="text-sm font-medium text-purple-600 mb-1">
                  {subscriptionLimits.planName} Plan
                </div>
                <div className="text-2xl font-bold text-purple-800">
                  {subscriptionLimits.currentCount}
                  <span className="text-sm text-purple-600 mx-1">of</span>
                  {subscriptionLimits.emailAccountLimit}
                </div>
                <div className="text-xs text-purple-600">
                  Email Accounts
                </div>
                {!subscriptionLimits.canAdd && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Limit reached - Upgrade to add more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Email Providers</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              if (subscriptionLimits?.canAdd !== false) {
                window.location.href = '/api/auth/google/connect';
              } else {
                toast({
                  title: "Account Limit Reached",
                  description: `Your ${subscriptionLimits?.planName} plan is limited to ${subscriptionLimits?.emailAccountLimit} email account${subscriptionLimits?.emailAccountLimit === 1 ? '' : 's'}. Please upgrade to add more accounts.`,
                  variant: "destructive"
                });
              }
            }}
            disabled={subscriptionLimits?.canAdd === false}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              subscriptionLimits?.canAdd === false 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
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
              if (subscriptionLimits?.canAdd !== false) {
                window.location.href = '/api/auth/outlook/connect';
              } else {
                toast({
                  title: "Account Limit Reached",
                  description: `Your ${subscriptionLimits?.planName} plan is limited to ${subscriptionLimits?.emailAccountLimit} email account${subscriptionLimits?.emailAccountLimit === 1 ? '' : 's'}. Please upgrade to add more accounts.`,
                  variant: "destructive"
                });
              }
            }}
            disabled={subscriptionLimits?.canAdd === false}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subscriptionLimits?.canAdd === false 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Add Outlook Account
          </button>
          <Link 
            href={subscriptionLimits?.canAdd === false ? '#' : "/settings/email-accounts/add-imap"}
            onClick={(e) => {
              if (subscriptionLimits?.canAdd === false) {
                e.preventDefault();
                toast({
                  title: "Account Limit Reached",
                  description: `Your ${subscriptionLimits?.planName} plan is limited to ${subscriptionLimits?.emailAccountLimit} email account${subscriptionLimits?.emailAccountLimit === 1 ? '' : 's'}. Please upgrade to add more accounts.`,
                  variant: "destructive"
                });
              }
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              subscriptionLimits?.canAdd === false 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Add IMAP Account
          </Link>
          <button
            onClick={handleRunLearning}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Run Learning Now
          </button>
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
            </div>
          </div>
        </div>
      )}
      
      {tableExists && tableChecked && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Connected Email Accounts</h2>
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {emailAccounts && emailAccounts.length > 0 ? (
                    emailAccounts.map((account) => (
                      <tr key={account.id} className={`${account.is_primary ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium">{account.email}</div>
                              {account.display_name && account.display_name !== account.email && (
                                <div className="text-xs text-gray-500">{account.display_name}</div>
                              )}
                            </div>
                            {account.is_primary && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Primary
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.is_primary 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {account.is_primary ? 'Primary Account' : 'Secondary Account'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
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
                            {(account.provider_type === 'outlook' || account.provider_type === 'microsoft') && (
                              <span className="px-1 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                                📮 Real-time sync
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.is_active !== false
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-48">
                          <div className="flex justify-end space-x-2">
                            {account.provider_type === 'imap' ? (
                              <button
                                onClick={() => handleSyncEmails(account.id)}
                                disabled={syncingAccounts.has(account.id)}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {syncingAccounts.has(account.id) ? 'Syncing...' : 'Sync'}
                              </button>
                            ) : (account.provider_type === 'microsoft' || account.provider_type === 'outlook') ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleGraphImport(account.id, 'inbox')}
                                    disabled={syncingAccounts.has(account.id)}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  >
                                    {syncingAccounts.has(account.id) ? 'Importing…' : 'Import Inbox'}
                                  </button>
                                  <button
                                    onClick={() => handleGraphImport(account.id, 'sent')}
                                    disabled={syncingAccounts.has(account.id)}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  >
                                    {syncingAccounts.has(account.id) ? 'Importing…' : 'Import Sent'}
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleCatchUpSync(account.id, 30)}
                                  disabled={syncingAccounts.has(account.id)}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                                  title="Sync emails from last sync date + AI learning"
                                >
                                  {syncingAccounts.has(account.id) ? 'Syncing…' : '🔄 Catch-up Sync'}
                                </button>
                              </div>
                            ) : account.provider_type === 'google' ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleGmailImport(account.id, 'inbox')}
                                    disabled={syncingAccounts.has(account.id)}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  >
                                    {syncingAccounts.has(account.id) ? 'Importing…' : 'Import Inbox'}
                                  </button>
                                  <button
                                    onClick={() => handleGmailImport(account.id, 'sent')}
                                    disabled={syncingAccounts.has(account.id)}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  >
                                    {syncingAccounts.has(account.id) ? 'Importing…' : 'Import Sent'}
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleCatchUpSync(account.id, 30)}
                                  disabled={syncingAccounts.has(account.id)}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                                  title="Sync emails from last sync date + AI learning"
                                >
                                  {syncingAccounts.has(account.id) ? 'Syncing…' : '🔄 Catch-up Sync'}
                                </button>
                              </div>
                            ) : null}
                            <Link 
                              href={`/settings/email-accounts/test/${account.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Test
                            </Link>
                            <Link 
                              href={`/settings/email-accounts/edit/${account.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                            <Link 
                              href={`/settings/email-accounts/delete/${account.id}`}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground">
                        No email accounts connected yet. Add an account to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
