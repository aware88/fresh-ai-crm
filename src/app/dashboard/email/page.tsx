'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OutlookClient from '@/components/email/outlook/OutlookClient';
import ImapClient from '@/components/email/imap/ImapClient';
import EmailComposer from '@/components/email/EmailComposer';
import { FaEnvelope, FaRobot, FaSearch, FaSync } from 'react-icons/fa';
import { Mail, Inbox, Send, AlertCircle, Database, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import TeamPresence from '@/components/collaboration/TeamPresence';
import TeamActivityFeed from '@/components/collaboration/TeamActivityFeed';
import TeamCollaborationGate from '@/components/subscription/TeamCollaborationGate';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';

import { useRouter } from 'next/navigation';
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
  
  // Modal states
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [salesResult, setSalesResult] = useState<any>(null);
  const [currentEmailInfo, setCurrentEmailInfo] = useState<{from: string; subject: string; body?: string} | null>(null);
  
  // Loading states
  const [isSalesProcessing, setIsSalesProcessing] = useState(false);
  const [showAIMonitor, setShowAIMonitor] = useState(false);
  const [aiTaskId, setAiTaskId] = useState<string | null>(null);
  

  
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
          body: emailData?.body
        });
        setSalesModalOpen(true);
        setIsSalesProcessing(false);
        setShowAIMonitor(false);
        setAiTaskId(null);
        return;
      }
      
      // Call the sales agent API
      const requestBody: any = { emailId };
      
      // If email data is provided (for IMAP emails), include it
      if (emailData) {
        requestBody.emailContent = {
          from: emailData.from,
          subject: emailData.subject,
          date: emailData.date,
          body: emailData.body
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
          body: data.email?.body || emailData?.body || 'No content available'
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
              lead_qualification: { score: 5, potential_value: 'Unknown', timeline: 'Unknown', decision_maker: 'Unknown' },
              opportunity_assessment: { buying_signals: ['Unable to process'], pain_points: ['Analysis failed'], objection_likelihood: 'Medium' },
              sales_insights: { key_opportunities: ['Please try again'], recommended_approach: 'Standard follow-up', urgency: 'Medium' },
              recommendations: { next_actions: ['Retry analysis'], approach_strategy: 'Standard', priority: 'Medium' }
            },
            error: 'Failed to process sales results'
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
  
  // Check if email accounts are connected (both Outlook and IMAP)
  const checkConnection = async () => {
    if (status === 'authenticated' && session?.user) {
      try {
        setLoading(true);
        const response = await fetch('/api/email/status');
        const data = await response.json();
        
        if (data.success) {
          setConnected(data.connected);
          
          // Process email accounts from the API response
          const allAccounts = data.emailAccounts || [];
          const microsoftAccounts = allAccounts.filter((acc: any) => acc.provider_type === 'microsoft' || acc.provider_type === 'outlook');
          const nonMicrosoftAccounts = allAccounts.filter((acc: any) => acc.provider_type !== 'microsoft' && acc.provider_type !== 'outlook');
          
          // Update Outlook connection status
          setOutlookConnected(microsoftAccounts.length > 0);
          
          // Set IMAP accounts (includes Google, IMAP, and other non-Microsoft accounts)
          setImapAccounts(nonMicrosoftAccounts);
          
          // Auto-select primary account if only one exists
          if (allAccounts.length === 1) {
            setSelectedAccount(allAccounts[0].id);
          }
          
          // Update last refresh timestamp
          setLastRefresh(Date.now());
        } else {
          setError(data.error || 'Failed to check connection');
        }
      } catch (err) {
        console.error('Error checking connection:', err);
        setError('Failed to check connection');
      } finally {
        setLoading(false);
      }
    }
  };

  // Initial connection check - run only once on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkConnection();
    }
  }, []); // Remove dependencies to prevent constant re-runs

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
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <FaEnvelope className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Connect Your Email</h2>
              <p className="text-gray-600 mt-2">
                Connect your email accounts to start managing and analyzing your emails with AI
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                      <FaEnvelope className="text-white text-sm" />
                    </div>
                    <h3 className="font-semibold">Google Gmail</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your Gmail account for seamless email management
                  </p>
                  <Button asChild className="w-full">
                    <a href="/settings/email-accounts">
                      Connect Gmail
                    </a>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <FaEnvelope className="text-white text-sm" />
                    </div>
                    <h3 className="font-semibold">Microsoft Outlook</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your Outlook account with secure OAuth authentication
                  </p>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <a href="/settings/email-accounts">
                      Connect Outlook
                    </a>
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                      <FaEnvelope className="text-white text-sm" />
                    </div>
                    <h3 className="font-semibold">IMAP/SMTP</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect any email provider using IMAP/SMTP
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href="/settings/email-accounts">
                      Connect IMAP
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <Button asChild variant="ghost">
                  <a href="/settings/email-accounts">
                    <FaRobot className="mr-2" />
                    Email Settings
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col"
      >


        {/* Email Dashboard with Combined Navigation */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Main Email Content */}
          <div className={`flex-1 transition-all duration-300`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              {/* Combined Navigation Header */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 flex-shrink-0">
                <div className="flex justify-between items-center p-3">
                  {/* Navigation Tabs */}
                  <TabsList className="grid grid-cols-5 rounded-md border bg-slate-50 border-slate-200 h-10">
                    <TabsTrigger value="inbox" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3">
                      <Inbox className="h-4 w-4" />
                      Inbox
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3">
                      <Send className="h-4 w-4" />
                      Sent
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3">
                      <Database className="h-4 w-4" />
                      Drafts
                    </TabsTrigger>
                    <TabsTrigger value="followups" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3">
                      <Clock className="h-4 w-4" />
                      Follow-ups
                    </TabsTrigger>
                    <TabsTrigger value="compose" className="flex items-center gap-2 data-[state=active]:bg-[var(--accent-color)] data-[state=active]:text-white text-sm px-3">
                      <Mail className="h-4 w-4" />
                      Compose
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Right side controls */}
                  <div className="flex items-center space-x-3">
                    {/* Account Selector - only show if more than one account or no account selected */}
                    {(outlookConnected && imapAccounts.length > 0) || (!selectedAccount && (outlookConnected || imapAccounts.length > 0)) ? (
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Select email account" />
                        </SelectTrigger>
                        <SelectContent>
                          {outlookConnected && (
                            <SelectItem value="outlook">Outlook</SelectItem>
                          )}
                          {imapAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      // Show current account info instead of dropdown when only one account
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-green-800">
                          {outlookConnected ? 'Microsoft Outlook' : imapAccounts[0]?.email || 'Email Account'}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>
                      </div>
                    )}
                    

                  </div>
                </div>
              </div>

          <TabsContent value="inbox" className="flex-1 min-h-0 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
              <div className="h-full">
                {outlookConnected && (selectedAccount === 'outlook' || !selectedAccount) ? (
                  <OutlookClient />
                ) : selectedAccount && imapAccounts.find(acc => acc.id === selectedAccount) ? (
                  <ImapClient 
                    account={imapAccounts.find(acc => acc.id === selectedAccount)} 
                    onSalesAgent={handleSalesAgent}
                    isSalesProcessing={isSalesProcessing}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an email account to view messages</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sent" className="flex-1 min-h-0 mt-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
              <div className="h-full">
                {outlookConnected && (selectedAccount === 'outlook' || !selectedAccount) ? (
                  <OutlookClient folder="sent" />
                ) : selectedAccount && imapAccounts.find(acc => acc.id === selectedAccount) ? (
                  <ImapClient 
                    account={imapAccounts.find(acc => acc.id === selectedAccount)} 
                    folder="Sent"
                    onSalesAgent={handleSalesAgent}
                    isSalesProcessing={isSalesProcessing}
                  />
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
                {outlookConnected && (selectedAccount === 'outlook' || !selectedAccount) ? (
                  <OutlookClient folder="drafts" />
                ) : selectedAccount && imapAccounts.find(acc => acc.id === selectedAccount) ? (
                  <ImapClient 
                    account={imapAccounts.find(acc => acc.id === selectedAccount)} 
                    folder="Drafts"
                    onSalesAgent={handleSalesAgent}
                    isSalesProcessing={isSalesProcessing}
                  />
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
                <EmailComposer />
              </div>
            </div>
          </TabsContent>


            </Tabs>
          </div>

          {/* Team Collaboration Sidebar - Collapsible */}
          <div className={`${isTeamSidebarCollapsed ? 'w-12' : 'w-80'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
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
              <div className="space-y-4">
                <TeamCollaborationGate 
                  feature="sidebar"
                  fallbackMessage="Team collaboration requires Pro plan"
                >
                  {/* Team Presence */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <h3 className="font-semibold text-sm">Team Online</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <TeamPresence compact={true} />
                    </CardContent>
                  </Card>

                  {/* Team Activity Feed */}
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600" />
                        <h3 className="font-semibold text-sm">Team Activity</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <TeamActivityFeed maxHeight="300px" />
                    </CardContent>
                  </Card>
                </TeamCollaborationGate>
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

      {/* Loading Modals */}
      
      <SalesAgentLoadingModal
        isOpen={isSalesProcessing}
        onClose={() => {}} // Don't allow closing while processing
      />
    </div>
  );
}
