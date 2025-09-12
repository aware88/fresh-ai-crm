'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import ModernEmailInterface from '@/components/email/ModernEmailInterface';
import { FaEnvelope, FaRobot } from 'react-icons/fa';
import {
  Mail,
  AlertCircle,
} from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';

import { useRouter } from 'next/navigation';
import { AnalysisResultsModal } from '@/components/email/AnalysisResultsModal';
import { SalesAgentResultsModal } from '@/components/email/SalesAgentResultsModal';
import { SalesAgentLoadingModal } from '@/components/email/SalesAgentResultsModal';

export default function EmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { organization } = useOrganization();
  const { hasFeature } = useSubscriptionFeatures(organization?.id || '');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imapAccounts, setImapAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<string>('');

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

  // Modern interface handles all email operations internally

  // Modern interface handles sync internally

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

  // Simplified connection check for modern interface
  const checkConnection = async () => {
    if (status === 'authenticated' && session?.user) {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/email/status');
        const data = await response.json();

        if (data.success) {
          setConnected(data.connected);
          const allAccounts = data.emailAccounts || [];
          setImapAccounts(allAccounts);

          // Auto-select first account
          if (allAccounts.length > 0) {
            setSelectedAccount(allAccounts[0].id);
            setSelectedEmailAccountId(allAccounts[0].id);
          }

          setLastRefresh(Date.now());
        } else {
          setError(data.error || 'Failed to check connection');
          setConnected(false);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
        setError('Failed to check connection. Please try refreshing the page.');
        setConnected(false);
      } finally {
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
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
    // Connected state - always show modern email interface
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full w-full"
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
              // Compose is handled within ModernEmailInterface - no need to switch
              console.log('Compose triggered from Modern interface');
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
}
