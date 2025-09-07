'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OutlookClient from '@/components/email/outlook/OutlookClient';
import ImapClient from '@/components/email/imap/ImapClient';
import EmailComposer from '@/components/email/EmailComposer';
import EnhancedEmailComposer from '@/components/email/EnhancedEmailComposer';
import OptimizedEmailList from '@/components/email/OptimizedEmailList';
import OptimizedEmailDetail from '@/components/email/OptimizedEmailDetail';
import EmailAccountSwitcher from '@/components/email/EmailAccountSwitcher';
import ModernEmailInterface from '@/components/email/ModernEmailInterface';
import { FaEnvelope, FaRobot, FaSearch, FaSync } from 'react-icons/fa';
import {
  Mail,
  Inbox,
  Send,
  AlertCircle,
  Database,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import TeamPresenceSimple from '@/components/collaboration/TeamPresenceSimple';
import TeamActivityFeedSimple from '@/components/collaboration/TeamActivityFeedSimple';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalysisResultsModal } from '@/components/email/AnalysisResultsModal';
import { SalesAgentResultsModal } from '@/components/email/SalesAgentResultsModal';
import { AnalysisLoadingModal } from '@/components/email/AnalysisResultsModal';
import { SalesAgentLoadingModal } from '@/components/email/SalesAgentResultsModal';
import EmailAIMonitor from '@/components/email/EmailAIMonitor';
import EnhancedFollowUpDashboard from '@/components/email/followup/EnhancedFollowUpDashboard';

export default function EmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { organization } = useOrganization();
  const { hasFeature } = useSubscriptionFeatures(organization?.id || '');
  const [isTeamSidebarCollapsed, setIsTeamSidebarCollapsed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [imapAccounts, setImapAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [selectedEmailId, setSelectedEmailId] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [useModernInterface, setUseModernInterface] = useState(true); // New state for modern interface
  
  // Safety timeout to reset syncing state
  useEffect(() => {
    if (syncing) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Syncing timeout reached, forcing reset');
        setSyncing(false);
        setSyncStatus('❌ Import timeout - please try again');
      }, 60000); // 60 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [syncing]);
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<string>('');
  
  // Compose state
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'replyAll' | 'forward'>('new');
  const [composeOriginalEmail, setComposeOriginalEmail] = useState<any>(null);
  
  // Helper function to get email data for reply/forward
  const getEmailForCompose = async (messageId: string) => {
    try {
      // Get email data from the optimized email service
      const response = await fetch(`/api/email/${messageId}`);
      if (response.ok) {
        const emailData = await response.json();
        return {
          subject: emailData.subject || '',
          body: emailData.html_content || emailData.plain_content || '',
          from: emailData.sender_email || '',
          to: emailData.recipient_email || '',
          messageId: emailData.message_id
        };
      }
    } catch (error) {
      console.error('Failed to get email for compose:', error);
    }
    return null;
  };

  // Modal states
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [salesResult, setSalesResult] = useState<any>(null);
  const [currentEmailInfo, setCurrentEmailInfo] = useState<{
    from: string;
    subject: string;
    body?: string;
  } | null>(null);

  // Loading states
  const [isSalesProcessing, setIsSalesProcessing] = useState(false);
  const [showAIMonitor, setShowAIMonitor] = useState(false);
  const [aiTaskId, setAiTaskId] = useState<string | null>(null);

  // Email counts for navigation
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [sentCount, setSentCount] = useState<number>(0);
  const [draftsCount, setDraftsCount] = useState<number>(0);

  // Keep minimal sync state for edge cases (if manual sync is ever needed)
  // Note: syncStatus already declared above

  // Handle email count changes from child components
  const handleInboxCountChange = (count: number) => setInboxCount(count);
  const handleSentCountChange = (count: number) => setSentCount(count);
  const handleDraftsCountChange = (count: number) => setDraftsCount(count);

  // Handle email sync
  const handleSyncEmails = async () => {
    if (!selectedAccount || syncing) return;
    
    setSyncing(true);
    setSyncStatus('Syncing emails from IMAP...');
    
    try {
      const response = await fetch('/api/email/sync-to-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          maxEmails: 100
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(`✅ Synced ${data.totalSaved} emails successfully!`);
        // Refresh the email list after sync
        window.location.reload(); // Simple refresh to reload emails
      } else {
        setSyncStatus(`❌ Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
      // Clear status after 5 seconds
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  // Handle Microsoft/Outlook email import
  const handleMicrosoftImport = async (accountId: string) => {
    if (!accountId || syncing) return;
    
    setSyncing(true);
    setSyncStatus('Importing emails from Microsoft Graph...');
    
    try {
      // Use the new Microsoft Graph sync endpoint
      const response = await fetch('/api/email/sync-microsoft-graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          maxEmails: 100 // Start with 100 emails for initial sync
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(`✅ Imported ${data.totalSaved || 0} emails from Microsoft Graph!`);
        // Refresh the email list after import
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setSyncStatus(`❌ Import failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Microsoft import error:', error);
      setSyncStatus(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
      // Clear status after 10 seconds (longer for import)
      setTimeout(() => setSyncStatus(''), 10000);
    }
  };

  // Check if Microsoft account needs import by checking email count
  const checkAndTriggerMicrosoftImport = async (accountId: string) => {
    try {
      console.log('🔍 Checking email count for Microsoft account:', accountId);
      
      // Check if there are any emails for this account in the database
      const response = await fetch(`/api/emails/count?accountId=${accountId}`);
      const data = await response.json();
      
      console.log('📊 Email count result:', data);
      
      if (data.success && data.count === 0) {
        console.log('📮 No emails found, triggering auto-import for Microsoft account:', accountId);
        handleMicrosoftImport(accountId);
      } else if (data.success) {
        console.log('✅ Microsoft account already has emails:', data.count);
      } else {
        console.warn('⚠️ Failed to check email count:', data.error);
      }
    } catch (error) {
      console.error('❌ Error checking Microsoft import status:', error);
    }
  };

  // Initialize real-time sync for all accounts
  useEffect(() => {
    console.log('Email Debug:', {
      selectedEmailAccountId,
      selectedAccount,
      hasActiveAccount: !!(selectedEmailAccountId || selectedAccount),
      imapAccountsCount: imapAccounts.length
    });
    
    // Start real-time sync for all connected accounts
    if (imapAccounts.length > 0 && !syncing) {
      imapAccounts.forEach(async (account) => {
        try {
          console.log(`🚀 Starting real-time sync for ${account.email} (${account.provider_type})`);
          
          const response = await fetch('/api/email/start-realtime-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId: account.id })
          });

          const result = await response.json();
          if (result.success) {
            console.log(`✅ Real-time sync active for ${account.email}`);
          } else {
            console.warn(`⚠️ Failed to start real-time sync for ${account.email}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error starting real-time sync for ${account.email}:`, error);
        }
      });
    }
    
    // Legacy fallback for manual import (will be replaced by real-time sync)
    const accountId = selectedEmailAccountId || selectedAccount;
    if (accountId && imapAccounts.length > 0) {
      const account = imapAccounts.find(acc => acc.id === accountId);
      console.log('🔍 Account check:', { 
        accountId, 
        account: account ? {
          email: account.email,
          provider_type: account.provider_type,
          last_sync_at: account.last_sync_at,
          real_time_sync_active: account.real_time_sync_active
        } : null,
        syncing 
      });
      
      // Only trigger manual import if real-time sync isn't active
      if (account && !syncing && !account.real_time_sync_active) {
        if (account.provider_type === 'imap' && !account.last_sync_at) {
          console.log('🔄 Auto-triggering first sync for IMAP account:', accountId);
          handleSyncEmails();
        } else if ((account.provider_type === 'microsoft' || account.provider_type === 'outlook')) {
          console.log('📮 Microsoft account detected, checking if import needed:', accountId);
          checkAndTriggerMicrosoftImport(accountId);
        }
      }
    }
  }, [selectedEmailAccountId, selectedAccount, imapAccounts, syncing]);

  // Email sync is now automatic when accounts are added

  // Handle sales agent action
  const handleSalesAgent = async (emailId: string, emailData?: any) => {
    setIsSalesProcessing(true);
    setShowAIMonitor(true);
    setAiTaskId('sales-' + Date.now());

    try {
      console.log('Processing with sales agent:', emailId, emailData);

      // First, try to get cached results for instant response
      const cacheResponse = await fetch(`/api/emails/ai-cache?emailId=${emailId}`);
      const cacheData = await cacheResponse.json();

      if (cacheData.cached && cacheData.analysis) {
        console.log('Using cached sales analysis results');
        setAnalysisResult(cacheData.analysis);
        setSalesResult(cacheData.analysis.salesIntelligence || cacheData.analysis);
        setCurrentEmailInfo({
          from: emailData?.from || 'Unknown',
          subject: emailData?.subject || 'No Subject',
          body: emailData?.body,
        });
        setSalesModalOpen(true);
        setIsSalesProcessing(false);
        setShowAIMonitor(false);
        setAiTaskId(null);
        return;
      }

      // If no cache, trigger background processing first
      if (!cacheData.cached) {
        console.log('No cached results, triggering background processing...');
        const backgroundResponse = await fetch('/api/emails/ai-cache', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailId,
            forceReprocess: false,
            skipDraft: false,
            emailContent: emailData
              ? {
                  from: emailData.from,
                  subject: emailData.subject,
                  date: emailData.date,
                  body: emailData.body,
                }
              : undefined,
          }),
        });

        const backgroundData = await backgroundResponse.json();

        if (backgroundData.success && backgroundData.analysis) {
          console.log('Background processing completed, using results');
          setAnalysisResult(backgroundData.analysis);
          setSalesResult(backgroundData.analysis.salesIntelligence || backgroundData.analysis);
          setCurrentEmailInfo({
            from: emailData?.from || 'Unknown',
            subject: emailData?.subject || 'No Subject',
            body: emailData?.body,
          });
          setSalesModalOpen(true);
          setIsSalesProcessing(false);
          setShowAIMonitor(false);
          setAiTaskId(null);
          return;
        }
      }

      // Call the sales agent API
      const requestBody: any = { emailId };

      // If email data is provided (for IMAP emails), include it
      if (emailData) {
        requestBody.emailContent = {
          from: emailData.from,
          subject: emailData.subject,
          date: emailData.date,
          body: emailData.body,
        };
      }

      const response = await fetch('/api/sales-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message or redirect to sales results
        console.log('Sales agent result:', data.analysis);

        // Set up modal data
        const emailInfo = {
          from: data.email?.from || emailData?.from || 'Unknown',
          subject: data.email?.subject || emailData?.subject || 'No Subject',
          body: data.email?.body || emailData?.body || 'No content available',
        };
        setCurrentEmailInfo(emailInfo);

        // Parse the sales result
        let salesData;
        try {
          console.log('Raw sales data:', data.analysis);
          console.log('Type of sales data:', typeof data.analysis);

          // The API now returns the parsed analysis object directly
          salesData = data.analysis;
        } catch (e) {
          console.error('Failed to handle sales result:', e);
          console.error('Raw data that failed to handle:', data.analysis);
          salesData = {
            analysis: {
              lead_qualification: {
                score: 5,
                potential_value: 'Unknown',
                timeline: 'Unknown',
                decision_maker: 'Unknown',
              },
              opportunity_assessment: {
                buying_signals: ['Unable to process'],
                pain_points: ['Analysis failed'],
                objection_likelihood: 'Medium',
              },
              sales_insights: {
                key_opportunities: ['Please try again'],
                recommended_approach: 'Standard follow-up',
                urgency: 'Medium',
              },
              recommendations: {
                next_actions: ['Retry analysis'],
                approach_strategy: 'Standard',
                priority: 'Medium',
              },
            },
            error: 'Failed to process sales results',
          };
        }

        setSalesResult(salesData);
        setSalesModalOpen(true);
      } else {
        console.error('Sales agent failed:', data.error);
        alert('Failed to process with sales agent: ' + data.error);
      }
    } catch (error) {
      console.error('Error processing with sales agent:', error);
      alert('Error processing with sales agent. Please try again.');
    } finally {
      setIsSalesProcessing(false);
    }
  };

  // Handle email analysis
  const handleAnalyzeEmail = async (emailId: string, emailData?: any) => {
    try {
      console.log('Analyzing email:', emailId, emailData);

      // Set up modal data
      const emailInfo = {
        from: emailData?.from || 'Unknown',
        subject: emailData?.subject || 'No Subject',
        body: emailData?.body || 'No content available',
      };
      setCurrentEmailInfo(emailInfo);

      // Check for cached analysis results
      const cacheResponse = await fetch(`/api/emails/ai-cache?emailId=${emailId}`);
      const cacheData = await cacheResponse.json();

      if (cacheData.cached && cacheData.analysis) {
        console.log('Using cached analysis results');
        setAnalysisResult(cacheData.analysis);
        setAnalysisModalOpen(true);
        return;
      }

      // If no cache, trigger background processing
      const backgroundResponse = await fetch('/api/emails/ai-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId,
          forceReprocess: false,
          skipDraft: false,
          emailContent: emailData
            ? {
                from: emailData.from,
                subject: emailData.subject,
                date: emailData.date,
                body: emailData.body,
              }
            : undefined,
        }),
      });

      const backgroundData = await backgroundResponse.json();

      if (backgroundData.success && backgroundData.analysis) {
        console.log('Background processing completed, using results');
        setAnalysisResult(backgroundData.analysis);
        setAnalysisModalOpen(true);
      } else {
        console.error('Analysis failed:', backgroundData.error);
        alert('Failed to analyze email: ' + backgroundData.error);
      }
    } catch (error) {
      console.error('Error analyzing email:', error);
      alert('Error analyzing email. Please try again.');
    }
  };

  // Check if email accounts are connected (both Outlook and IMAP)
  const checkConnection = async () => {
    if (status === 'authenticated' && session?.user) {
      try {
        setLoading(true);
        setError(''); // Clear any previous errors

        console.log(
          '🔍 Checking email connection for user:',
          session?.user?.id || session?.user?.email
        );
        const response = await fetch('/api/email/status');
        const data = await response.json();

        if (data.success) {
          setConnected(data.connected);

          // Process email accounts from the API response
          const allAccounts = data.emailAccounts || [];

          const microsoftAccounts = allAccounts.filter(
            (acc: any) => acc.provider_type === 'microsoft' || acc.provider_type === 'outlook'
          );
          // Accounts backed by our database (IMAP and imported Microsoft)
          const storageAccounts = allAccounts.filter(
            (acc: any) => ['imap', 'microsoft', 'outlook', 'google'].includes(acc.provider_type)
          );

          // Update Outlook connection status
          setOutlookConnected(microsoftAccounts.length > 0);

          // Set accounts that are backed by our storage (IMAP + Microsoft)
          setImapAccounts(storageAccounts);

          // Auto-select primary account
          if (storageAccounts.length > 0) {
            // Prefer IMAP account for optimized list UI
            const activeImap =
              storageAccounts.find((acc: any) => acc.is_active !== false) ||
              storageAccounts[0];
            setSelectedAccount(activeImap.id);
          } else if (microsoftAccounts.length > 0) {
            // If only Outlook is connected, use special key
            setSelectedAccount('outlook');
          }

          // Update last refresh timestamp
          setLastRefresh(Date.now());
        } else if (response.status === 401) {
          // Authentication issue - try alternative approach
          console.log('Authentication failed, trying alternative approach...');
          try {
            const altResponse = await fetch('/api/email/accounts');
            const altData = await altResponse.json();

            if (altData.success && altData.accounts && altData.accounts.length > 0) {
              setConnected(true);
              const allAccounts = altData.accounts.map((acc: any) => ({
                ...acc,
                provider_type: acc.provider_type || 'imap', // Ensure provider_type exists
              }));

              const microsoftAccounts = allAccounts.filter(
                (acc: any) => acc.provider_type === 'microsoft' || acc.provider_type === 'outlook'
              );
              const nonMicrosoftAccounts = allAccounts.filter(
                (acc: any) => acc.provider_type !== 'microsoft' && acc.provider_type !== 'outlook'
              );

              setOutlookConnected(microsoftAccounts.length > 0);
              // In this fallback path, use non-Microsoft accounts for IMAP/storage-backed UI
              setImapAccounts(nonMicrosoftAccounts);

              if (nonMicrosoftAccounts.length > 0) {
                setSelectedAccount(nonMicrosoftAccounts[0].id);
              } else if (microsoftAccounts.length > 0) {
                setSelectedAccount('outlook');
              }
              setLastRefresh(Date.now());
            } else {
              setConnected(false);
            }
          } catch (altErr) {
            console.error('Alternative approach also failed:', altErr);
            setConnected(false);
          }
        } else {
          setError(data.error || 'Failed to check connection');
          setConnected(false); // Ensure we show the connection UI
        }
      } catch (err) {
        console.error('Error checking connection:', err);
        setError('Failed to check connection. Please try refreshing the page.');
        setConnected(false); // Ensure we show the connection UI
      } finally {
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
      // User is not authenticated, clear loading state
      setLoading(false);
      setConnected(false);
    }
  };

  // Initial connection check - run when status or session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkConnection();
    } else if (status === 'unauthenticated') {
      // Clear states when not authenticated
      setLoading(false);
      setConnected(false);
      setError('');
    }
  }, [status, session]); // Add dependencies to properly handle auth state changes

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (loading && status === 'authenticated') {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing state reset');
        setLoading(false);
        setConnected(false);
        setError('Loading timeout. Please refresh the page.');
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, status]);

  // Removed auto-refresh to prevent constant page refreshes
  // useEffect(() => {
  //   if (status === 'authenticated' && session?.user) {
  //     const interval = setInterval(() => {
  //       // Only refresh if it's been more than 30 seconds since last refresh
  //       if (Date.now() - lastRefresh > 30000) {
  //         checkConnection();
  //       }
  //     }, 30000); // 30 seconds instead of frequent polling
  //
  //     return () => clearInterval(interval);
  //   }
  // }, [status, session, lastRefresh]);

  // If not authenticated, show loading or let middleware handle it
  if (status === 'unauthenticated') {
    // Don't redirect here - let the middleware handle authentication
    // This prevents race conditions during sign-in process
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        </Alert>
      </div>
    );
  }

  // Note: Removed auto-redirect logic to prevent React errors
  // Users now see the email setup UI which is more user-friendly

  // Show email setup UI when no accounts are connected
  if (!connected) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-6xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
                <FaEnvelope className="text-white text-3xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Connect Your Email</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect your email accounts to start managing and analyzing your emails with
                AI-powered insights and automation
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-purple-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Google Gmail</h3>
                      <p className="text-sm text-gray-500">Most popular choice</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Connect your Gmail account for seamless email management with secure OAuth
                    authentication
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/api/auth/google/connect')}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Connect Gmail
                  </Button>
                </div>

                <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Microsoft Outlook</h3>
                      <p className="text-sm text-gray-500">Enterprise ready</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Connect your Outlook account with secure OAuth authentication and
                    enterprise-grade security
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/api/auth/outlook/connect')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Connect Outlook
                  </Button>
                </div>

                <div className="p-6 border-2 border-gray-100 rounded-xl hover:border-orange-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-orange-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FaEnvelope className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">IMAP/SMTP</h3>
                      <p className="text-sm text-gray-500">Universal support</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Connect any email provider using IMAP/SMTP protocols for maximum compatibility
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/settings/email-accounts/add-imap')}
                    variant="outline"
                    className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Connect IMAP
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4">
                <div className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <FaRobot className="text-lg" />
                  <span className="text-sm">Need help? Check our</span>
                  <Button
                    asChild
                    variant="link"
                    className="p-0 h-auto text-sm text-purple-600 hover:text-purple-700"
                  >
                    <a href="/settings/email-accounts">Email Settings</a>
                  </Button>
                  <span className="text-sm">for advanced configuration</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  } else {
    // Connected state - show main email dashboard
    // Use modern interface if enabled and IMAP accounts are available
    if (useModernInterface && imapAccounts.length > 0) {
      return (
        <div className="h-full flex flex-col overflow-hidden p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {/* Modern Email Interface */}
            <ModernEmailInterface
              emailAccountId={selectedEmailAccountId || selectedAccount}
              accounts={imapAccounts}
              onAccountChange={(accountId) => {
                setSelectedEmailAccountId(accountId);
                setSelectedAccount(accountId);
              }}
              onAnalyzeEmail={handleAnalyzeEmail}
              onSalesAgent={handleSalesAgent}
              onCompose={() => {
                setActiveTab('compose');
                setUseModernInterface(false); // Temporarily switch to classic for compose
              }}
            />
          </motion.div>

          {/* Analysis Results Modals */}
          <AnalysisResultsModal
            isOpen={analysisModalOpen}
            onClose={() => setAnalysisModalOpen(false)}
            result={analysisResult}
            emailInfo={currentEmailInfo || { from: '', subject: '' }}
          />
          
          <SalesAgentResultsModal
            isOpen={salesModalOpen}
            onClose={() => setSalesModalOpen(false)}
            result={salesResult}
            emailInfo={currentEmailInfo || { from: '', subject: '' }}
          />

          <SalesAgentLoadingModal
            isOpen={isSalesProcessing}
            onClose={() => {}}
          />
        </div>
      );
    }

    // Classic interface fallback
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full flex flex-col overflow-hidden"
        >
          {/* Toggle button to switch interfaces */}
          <div className="px-4 py-2 bg-white border-b border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseModernInterface(!useModernInterface)}
              className="text-xs"
            >
              Switch to {useModernInterface ? 'Classic' : 'Modern'} Interface
            </Button>
          </div>

          {/* Email Dashboard with Combined Navigation */}
          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Main Email Content */}
            <div className={`flex-1 transition-all duration-300`}>
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                // Reset compose state when clicking compose tab directly
                if (value === 'compose') {
                  setComposeMode('new');
                  setComposeOriginalEmail(null);
                }
              }} className="flex flex-col h-full">
                {/* Combined Navigation Header */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 flex-shrink-0">
                  {/* Navigation Tabs - Full width row */}
                  <div className="p-3 border-b border-gray-100">
                    <TabsList className="grid grid-cols-5 rounded-md border bg-slate-50 border-slate-200 h-10 w-full">
                      <TabsTrigger
                        value="inbox"
                        className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3"
                      >
                        <Inbox className="h-4 w-4" />
                        Inbox {inboxCount > 0 && `(${inboxCount})`}
                      </TabsTrigger>
                      <TabsTrigger
                        value="sent"
                        className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3"
                      >
                        <Send className="h-4 w-4" />
                        Sent {sentCount > 0 && `(${sentCount})`}
                      </TabsTrigger>
                      <TabsTrigger
                        value="drafts"
                        className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3"
                      >
                        <Database className="h-4 w-4" />
                        Drafts {draftsCount > 0 && `(${draftsCount})`}
                      </TabsTrigger>

                      <TabsTrigger
                        value="followups"
                        className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3"
                      >
                        <Clock className="h-4 w-4" />
                        Follow-ups
                      </TabsTrigger>
                      <TabsTrigger
                        value="compose"
                        className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3"
                      >
                        <Mail className="h-4 w-4" />
                        Compose
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Controls - Separate row */}
                  <div className="flex justify-between items-center px-3 py-2">
                    {/* Email Account Switcher */}
                    <EmailAccountSwitcher
                      selectedAccountId={selectedEmailAccountId}
                      onAccountChange={(accountId) => {
                        setSelectedEmailAccountId(accountId);
                        setSelectedAccount(accountId); // Keep existing functionality
                      }}
                      showAddButton={true}
                    />

                    {/* Right side controls */}
                    <div className="flex items-center space-x-2">
                      {/* Sync Button */}
                      {(() => {
                        const accountId = selectedEmailAccountId || selectedAccount;
                        const acc = imapAccounts.find((a) => a.id === accountId);
                        
                        if (acc && acc.provider_type === 'imap') {
                          return (
                            <Button
                              onClick={handleSyncEmails}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 text-xs"
                              disabled={syncing}
                            >
                              <FaSync className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                              {syncing ? 'Syncing...' : 'Sync Emails'}
                            </Button>
                          );
                        }
                        return null;
                      })()}

                      {/* Real-time Sync Status / Manual Import Button */}
                      {(() => {
                        const accountId = selectedEmailAccountId || selectedAccount;
                        const acc = imapAccounts.find((a) => a.id === accountId);
                        
                        if (acc && (acc.provider_type === 'microsoft' || acc.provider_type === 'outlook')) {
                          // Check if real-time sync is active
                          const isRealTimeActive = acc.real_time_sync_active;
                          
                          if (isRealTimeActive) {
                            return (
                              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-md">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-700 font-medium">Live Sync Active</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() => handleMicrosoftImport(accountId)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                                  disabled={syncing}
                                >
                                  <Download className="h-3 w-3" />
                                  {syncing ? 'Importing...' : 'Import Now'}
                                </Button>
                                {syncing && (
                                  <Button
                                    onClick={() => {
                                      setSyncing(false);
                                      setSyncStatus('');
                                      console.log('🔄 Manually reset syncing state');
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Reset import state"
                                  >
                                    ✕
                                  </Button>
                                )}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}

                      {/* Refresh Button */}
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs"
                      >
                        <FaSync className="h-3 w-3" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  {/* Sync Status */}
                  {syncStatus && (
                    <div className="px-3 py-2 bg-blue-50 border-t border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">{syncStatus}</p>
                    </div>
                  )}
                </div>

                <TabsContent value="inbox" className="flex-1 min-h-0 mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex">
                    {(selectedEmailAccountId || selectedAccount) ? (
                      <>
                        {/* Email List - Fixed width sidebar */}
                        <div className="w-96 border-r border-gray-200 flex flex-col h-full">
                          <div className="flex-1 overflow-hidden">
                            <OptimizedEmailList
                              emailAccountId={selectedEmailAccountId || selectedAccount}
                              folder="INBOX"
                              onEmailSelect={(messageId) => {
                                setSelectedEmailId(messageId);
                              }}
                              onAnalyzeEmail={handleAnalyzeEmail}
                              onSalesAgent={handleSalesAgent}
                            />
                          </div>
                        </div>

                        {/* Email Detail - Flexible width main content */}
                        <div className="flex-1 flex flex-col h-full">
                          {selectedEmailId ? (
                            <OptimizedEmailDetail
                              messageId={selectedEmailId}
                              onReply={async () => {
                                const emailData = await getEmailForCompose(selectedEmailId);
                                setComposeMode('reply');
                                setComposeOriginalEmail(emailData);
                                setActiveTab('compose');
                              }}
                              onReplyAll={async () => {
                                const emailData = await getEmailForCompose(selectedEmailId);
                                setComposeMode('replyAll');
                                setComposeOriginalEmail(emailData);
                                setActiveTab('compose');
                              }}
                              onForward={async () => {
                                const emailData = await getEmailForCompose(selectedEmailId);
                                setComposeMode('forward');
                                setComposeOriginalEmail(emailData);
                                setActiveTab('compose');
                              }}
                              onArchive={() => {
                                // Handle archive
                                setSelectedEmailId('');
                              }}
                              onDelete={() => {
                                // Handle delete
                                setSelectedEmailId('');
                              }}
                              onBack={() => {
                                setSelectedEmailId('');
                              }}
                            />
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                              <div className="text-center">
                                <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium mb-2">
                                  Select an email to read
                                </h3>
                                <p className="text-sm">
                                  Choose an email from the list to view its contents
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : outlookConnected ? (
                      // Outlook (Microsoft Graph) live client
                      <div className="flex-1 min-h-0">
                        <OutlookClient folder="inbox" />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {(selectedEmailAccountId || selectedAccount) && imapAccounts.length > 0 ? (
                          // Account is connected but no emails loaded
                          <>
                            <Database className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                            <h3 className="text-lg font-medium mb-2">Ready to Import Emails</h3>
                            <p className="mb-4 max-w-md mx-auto">
                              Your email account is connected! For Microsoft/Outlook accounts, you need to import emails first.
                            </p>
                            <div className="space-y-3">
                              <Link href="/settings/email-accounts">
                                <Button variant="outline" className="mb-2">
                                  <Download className="h-4 w-4 mr-2" />
                                  Import Emails from Settings
                                </Button>
                              </Link>
                              <div className="space-y-2 text-sm text-gray-400">
                                <div>📮 Microsoft accounts use secure import process</div>
                                <div>🔒 Your emails stay private and secure</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          // No accounts connected
                          <>
                            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium mb-2">No Email Accounts Connected</h3>
                            <p className="mb-4 max-w-md mx-auto">
                              Connect your email accounts to start managing and analyzing your messages with AI-powered insights.
                            </p>
                            <div className="space-y-3">
                              <Link href="/settings/email-accounts">
                                <Button className="mb-2">
                                  <Mail className="h-4 w-4 mr-2" />
                                  Connect Email Accounts
                                </Button>
                              </Link>
                              <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center justify-center space-x-2">
                                  <span>📧 Gmail, Outlook, IMAP supported</span>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                  <span>🤖 AI-powered email analysis</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>



                <TabsContent value="sent" className="flex-1 min-h-0 mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                    <div className="h-full">
                      {(selectedEmailAccountId || selectedAccount) ? (
                        <>
                          {/* Show OptimizedEmailList for sent emails from our database */}
                          <div className="flex h-full">
                            {/* Email List - Fixed width sidebar */}
                            <div className="w-96 border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
                              <div className="flex-1 overflow-hidden">
                                <OptimizedEmailList
                                  emailAccountId={selectedEmailAccountId || selectedAccount}
                                  folder="Sent"
                                  selectedEmailId={selectedEmailId}
                                  onEmailSelect={(messageId) => {
                                    console.log('🔥 [EmailPage] Sent email selected:', messageId);
                                    setSelectedEmailId(messageId);
                                  }}
                                  onAnalyzeEmail={handleAnalyzeEmail}
                                  onSalesAgent={handleSalesAgent}
                                />
                              </div>
                            </div>

                            {/* Email Detail - Flexible width main content */}
                            <div className="flex-1 flex flex-col h-full">
                              {selectedEmailId ? (
                                <OptimizedEmailDetail
                                  messageId={selectedEmailId}
                                  onReply={async () => {
                                    const emailData = await getEmailForCompose(selectedEmailId);
                                    setComposeMode('reply');
                                    setComposeOriginalEmail(emailData);
                                    setActiveTab('compose');
                                  }}
                                  onReplyAll={async () => {
                                    const emailData = await getEmailForCompose(selectedEmailId);
                                    setComposeMode('replyAll');
                                    setComposeOriginalEmail(emailData);
                                    setActiveTab('compose');
                                  }}
                                  onForward={async () => {
                                    const emailData = await getEmailForCompose(selectedEmailId);
                                    setComposeMode('forward');
                                    setComposeOriginalEmail(emailData);
                                    setActiveTab('compose');
                                  }}
                                  onArchive={() => {
                                    // Handle archive
                                    setSelectedEmailId('');
                                  }}
                                  onDelete={() => {
                                    // Handle delete
                                    setSelectedEmailId('');
                                  }}
                                  onBack={() => {
                                    setSelectedEmailId('');
                                  }}
                                />
                              ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                  <div className="text-center">
                                    <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mb-2">
                                      Select a sent email to read
                                    </h3>
                                    <p className="text-sm">
                                      Choose an email from the list to view its contents
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Legacy clients for backward compatibility */}
                          <div className="hidden">
                            {outlookConnected && (selectedAccount === 'outlook' || !selectedAccount) ? (
                              <OutlookClient folder="sent" />
                            ) : selectedAccount &&
                              imapAccounts.find((acc) => acc.id === selectedAccount) ? (
                              <ImapClient
                                account={imapAccounts.find((acc) => acc.id === selectedAccount)}
                                folder="Sent"
                                onSalesAgent={handleSalesAgent}
                                isSalesProcessing={isSalesProcessing}
                                onEmailCountChange={handleSentCountChange}
                              />
                            ) : null}
                          </div>
                        </>
                      ) : outlookConnected ? (
                        <OutlookClient folder="sent" />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Select an email account to view sent messages</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="drafts" className="flex-1 min-h-0 mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                    <div className="h-full">
                      {selectedAccount &&
                        imapAccounts.find((acc) => acc.id === selectedAccount) ? (
                        <ImapClient
                          account={imapAccounts.find((acc) => acc.id === selectedAccount)}
                          folder="Drafts"
                          onSalesAgent={handleSalesAgent}
                          isSalesProcessing={isSalesProcessing}
                          onEmailCountChange={handleDraftsCountChange}
                        />
                      ) : outlookConnected ? (
                        <OutlookClient folder="drafts" />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Select an email account to view draft messages</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="followups" className="flex-1 min-h-0 mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 flex-shrink-0">
                      <h3 className="font-medium flex items-center gap-2 text-gray-800">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Email Follow-ups
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Phase 3: AI Automation
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 p-4">
                      <EnhancedFollowUpDashboard />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compose" className="flex-1 min-h-0 mt-0">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 flex-shrink-0">
                      <h3 className="font-medium flex items-center gap-2 text-gray-800">
                        <Send className="h-4 w-4 text-green-600" />
                        Compose Email
                      </h3>
                    </div>
                    <div className="p-4 flex-1 min-h-0">
                      <EnhancedEmailComposer
                        mode={composeMode}
                        originalEmail={composeOriginalEmail}
                        onSend={async (emailData) => {
                          try {
                            console.log('Sending email:', emailData);
                            
                            // Send email via API
                            const response = await fetch('/api/email/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                to: emailData.to,
                                cc: emailData.cc,
                                bcc: emailData.bcc,
                                subject: emailData.subject,
                                body: emailData.body,
                                attachments: emailData.attachments,
                                priority: 'normal'
                              })
                            });

                            if (response.ok) {
                              const result = await response.json();
                              console.log('Email sent successfully:', result);
                              
                              // Show success message
                              alert('Email sent successfully!');
                              
                              // Reset compose state after sending
                              setComposeMode('new');
                              setComposeOriginalEmail(null);
                              
                              // Switch back to inbox
                              setActiveTab('inbox');
                            } else {
                              const error = await response.json();
                              console.error('Failed to send email:', error);
                              alert(`Failed to send email: ${error.message || 'Unknown error'}`);
                            }
                          } catch (error) {
                            console.error('Error sending email:', error);
                            alert('Failed to send email. Please try again.');
                          }
                        }}
                        onSave={async (emailData) => {
                          // Handle draft saving
                          console.log('Saving draft:', emailData);
                        }}
                        onClose={() => {
                          // Reset compose state when closing
                          setComposeMode('new');
                          setComposeOriginalEmail(null);
                          // Handle close - could switch back to inbox
                          setActiveTab('inbox');
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Team Collaboration Sidebar - Collapsible */}
            <div
              className={`${isTeamSidebarCollapsed ? 'w-12' : 'w-80'} flex-shrink-0 transition-all duration-300 ease-in-out`}
            >
              {/* Collapse/Expand Button */}
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTeamSidebarCollapsed(!isTeamSidebarCollapsed)}
                  className="w-full justify-center p-2 h-8 hover:bg-gray-100"
                >
                  {isTeamSidebarCollapsed ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Team Collaboration Content */}
              {!isTeamSidebarCollapsed && (
                <div className="h-full flex flex-col gap-4 pb-10">
                  {/* Team Presence */}
                  <Card className="flex-shrink-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-sm">Team Online</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <TeamPresenceSimple compact={true} />
                    </CardContent>
                  </Card>

                  {/* Team Activity Feed */}
                  <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <h3 className="font-semibold text-sm">Team Activity</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 min-h-0 overflow-hidden">
                      <TeamActivityFeedSimple maxHeight="100%" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Monitor - when active */}
              {showAIMonitor && (
                <div className="w-full">
                  <EmailAIMonitor
                    isActive={!!aiTaskId}
                    currentTask="Analyzing email and generating sales response"
                    onPause={() => console.log('AI paused')}
                    onResume={() => console.log('AI resumed')}
                    onStop={() => {
                      setAiTaskId(null);
                      setShowAIMonitor(false);
                      setIsSalesProcessing(false);
                    }}
                    onIntervene={(step) => console.log('Intervene in step:', step)}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Analysis Results Modals */}
        <AnalysisResultsModal
          isOpen={analysisModalOpen}
          onClose={() => setAnalysisModalOpen(false)}
          result={analysisResult}
          emailInfo={currentEmailInfo || { from: '', subject: '' }}
        />
        
        <SalesAgentResultsModal
          isOpen={salesModalOpen}
          onClose={() => setSalesModalOpen(false)}
          result={salesResult}
          emailInfo={currentEmailInfo || { from: '', subject: '' }}
        />

        <SalesAgentLoadingModal
          isOpen={isSalesProcessing}
          onClose={() => {}}
        />
      </div>
    );
  }
}
