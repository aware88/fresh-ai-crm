'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OutlookClient from '@/components/email/outlook/OutlookClient';
import ImapClient from '@/components/email/imap/ImapClient';
import EmailAnalyserClient from "@/app/dashboard/email-analyser/EmailAnalyserClient";
import { FaEnvelope, FaRobot, FaSearch, FaSync, FaCog } from 'react-icons/fa';
import { Mail, TrendingUp, Inbox, Send, AlertCircle, Database, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnalysisResultsModal } from '@/components/email/AnalysisResultsModal';
import { SalesAgentResultsModal } from '@/components/email/SalesAgentResultsModal';
import { AnalysisLoadingModal } from '@/components/email/AnalysisResultsModal';
import { SalesAgentLoadingModal } from '@/components/email/SalesAgentResultsModal';


export default function EmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const [currentEmailInfo, setCurrentEmailInfo] = useState<{from: string; subject: string} | null>(null);
  
  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSalesProcessing, setIsSalesProcessing] = useState(false);
  
  // Handle email analysis
  const handleAnalyzeEmail = async (emailId: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Analyzing email:', emailId);
      
      // Call the email analysis API
      const response = await fetch('/api/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message or redirect to analysis results
        console.log('Email analysis result:', data.analysis);
        
        // Set up modal data
        const emailInfo = {
          from: data.email?.from || 'Unknown',
          subject: data.email?.subject || 'No Subject'
        };
        setCurrentEmailInfo(emailInfo);
        
        // Parse the analysis result
        let analysisData;
        try {
          console.log('Raw analysis data:', data.analysis);
          console.log('Type of analysis data:', typeof data.analysis);
          
          // The API now returns the parsed analysis object directly
          analysisData = data.analysis;
        } catch (e) {
          console.error('Failed to handle analysis result:', e);
          console.error('Raw data that failed to handle:', data.analysis);
          analysisData = {
            analysis: {
              personality: { traits: ['Unable to process'], communication_style: 'Unknown', tone: 'Unknown' },
              context: { relationship_type: 'Unknown', urgency_level: 'Medium', topic_category: 'General' },
              insights: { key_points: ['Analysis processing failed'], sentiment: 'Unknown', intent: 'Unknown' },
              recommendations: { response_suggestions: ['Please try again'], next_steps: ['Check system configuration'] }
            },
            error: 'Failed to process analysis results'
          };
        }
        
        setAnalysisResult(analysisData);
        setAnalysisModalOpen(true);
      } else {
        console.error('Analysis failed:', data.error);
        alert('Failed to analyze email: ' + data.error);
      }
    } catch (error) {
      console.error('Error analyzing email:', error);
      alert('Error analyzing email. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle sales agent action
  const handleSalesAgent = async (emailId: string) => {
    setIsSalesProcessing(true);
    try {
      console.log('Processing with sales agent:', emailId);
      
      // Call the sales agent API
      const response = await fetch('/api/sales-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message or redirect to sales results
        console.log('Sales agent result:', data.analysis);
        
        // Set up modal data
        const emailInfo = {
          from: data.email?.from || 'Unknown',
          subject: data.email?.subject || 'No Subject'
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
          const googleAccounts = allAccounts.filter((acc: any) => acc.provider_type === 'google');
          
          // Update Outlook connection status
          setOutlookConnected(microsoftAccounts.length > 0);
          
          // Set IMAP accounts (Google accounts)
          setImapAccounts(googleAccounts);
          
          // Auto-select primary account if only one exists
          if (allAccounts.length === 1 && !selectedAccount) {
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

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, [status, session]);

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

  // If not authenticated, redirect to sign in
  if (status === 'unauthenticated') {
    router.push('/signin');
    return null;
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

  // Show connection required state
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Link href="/settings/email-accounts">
                      Connect Gmail
                    </Link>
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
                    <Link href="/settings/email-accounts">
                      Connect IMAP
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <Button asChild variant="ghost">
                  <Link href="/settings/email-accounts">
                    <FaCog className="mr-2" />
                    Email Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Email Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage, analyze, and respond to your emails with AI assistance
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Account Selector - only show if more than one account or no account selected */}
            {(outlookConnected && imapAccounts.length > 0) || (!selectedAccount && (outlookConnected || imapAccounts.length > 0)) ? (
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-48">
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
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {outlookConnected ? 'Outlook' : imapAccounts[0]?.email || 'Email Account'}
                </span>
              </div>
            )}
            
            <Button asChild variant="outline">
              <Link href="/settings/email-accounts">
                <FaCog className="mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Email Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Gmail Inbox
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Compose
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-blue-600" />
                  Email Inbox
                </h3>
              </CardHeader>
              <CardContent>
                {outlookConnected && (selectedAccount === 'outlook' || !selectedAccount) ? (
                  <OutlookClient />
                ) : selectedAccount && imapAccounts.find(acc => acc.id === selectedAccount) ? (
                  <ImapClient 
                    account={imapAccounts.find(acc => acc.id === selectedAccount)} 
                    onAnalyzeEmail={handleAnalyzeEmail}
                    onSalesAgent={handleSalesAgent}
                    isAnalyzing={isAnalyzing}
                    isSalesProcessing={isSalesProcessing}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Select an email account to view messages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  AI Email Analysis
                </h3>
              </CardHeader>
              <CardContent>
                <EmailAnalyserClient />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compose" className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Compose Email
                </h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Email composition feature coming soon</p>
                  <p className="text-sm mt-2">You can compose emails directly from your connected email client for now</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
      <AnalysisLoadingModal
        isOpen={isAnalyzing}
        onClose={() => {}} // Don't allow closing while processing
      />
      
      <SalesAgentLoadingModal
        isOpen={isSalesProcessing}
        onClose={() => {}} // Don't allow closing while processing
      />
    </div>
  );
}
