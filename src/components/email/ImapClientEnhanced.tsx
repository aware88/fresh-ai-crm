'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phase2IntelligenceDisplay } from './Phase2IntelligenceDisplay';
import { 
  FaEnvelope, 
  FaSpinner, 
  FaRobot, 
  FaBrain,
  FaChartLine,
  FaExclamationCircle
} from 'react-icons/fa';
import { RefreshCw, Loader2 } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isRead?: boolean;
}

interface ImapAccount {
  id: string;
  email: string;
  provider_type: string;
  is_active: boolean;
}

interface ImapClientEnhancedProps {
  account: ImapAccount;
}

export default function ImapClientEnhanced({ account }: ImapClientEnhancedProps) {
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  
  // Email data state
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [displayCount, setDisplayCount] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Phase 2 Intelligence state
  const [phase2Intelligence, setPhase2Intelligence] = useState<any>(null);
  const [phase2SalesIntelligence, setPhase2SalesIntelligence] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSalesProcessing, setIsSalesProcessing] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showSalesIntelligence, setShowSalesIntelligence] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string>('');

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const CACHE_KEY = `emails_cache_${session?.user?.id || 'anonymous'}`;

  // Load emails from cache or fetch from API
  const loadEmails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          setEmails(parsed.emails || []);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const response = await fetch(`/api/email/imap/${account.id}/emails`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails || []);
        
        // Cache the results
        const cacheData = {
          emails: data.emails,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } else {
        throw new Error(data.error || 'Failed to load emails');
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    if (account?.id && session?.user) {
      loadEmails();
    }
  }, [account?.id, session?.user]);

  // Phase 2 AI Analysis
  const handlePhase2Analysis = async () => {
    if (!selectedEmail) return;

    setIsAnalyzing(true);
    setPhase2Intelligence(null);
    
    try {
      console.log('Starting Phase 2 Intelligence Analysis...');
      
      const response = await fetch('/api/email/analyze-phase2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          emailContent: {
            from: selectedEmail.from,
            subject: selectedEmail.subject,
            date: selectedEmail.date,
            body: selectedEmail.body
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Phase 2 Intelligence Analysis Complete:', data.phase2_intelligence);
        setPhase2Intelligence(data.phase2_intelligence);
        setShowIntelligence(true);
      } else {
        throw new Error(data.error || 'Failed to analyze email with Phase 2 Intelligence');
      }
    } catch (error) {
      console.error('Error in Phase 2 Analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze email');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Phase 2 Sales Agent
  const handlePhase2SalesAgent = async () => {
    if (!selectedEmail) return;

    setIsSalesProcessing(true);
    setPhase2SalesIntelligence(null);
    setGeneratedResponse('');
    
    try {
      console.log('Starting Phase 2 Sales Intelligence...');
      
      const response = await fetch('/api/email/sales-agent-phase2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          emailContent: {
            from: selectedEmail.from,
            subject: selectedEmail.subject,
            date: selectedEmail.date,
            body: selectedEmail.body
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Phase 2 Sales Intelligence Complete:', data.phase2_sales_intelligence);
        setPhase2SalesIntelligence(data.phase2_sales_intelligence);
        setGeneratedResponse(data.generated_response || '');
        setShowSalesIntelligence(true);
      } else {
        throw new Error(data.error || 'Failed to process email with Phase 2 Sales Intelligence');
      }
    } catch (error) {
      console.error('Error in Phase 2 Sales Agent:', error);
      setError(error instanceof Error ? error.message : 'Failed to process with sales agent');
    } finally {
      setIsSalesProcessing(false);
    }
  };

  // Handle email selection
  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    // Clear previous intelligence when selecting new email
    setPhase2Intelligence(null);
    setPhase2SalesIntelligence(null);
    setGeneratedResponse('');
  };

  // Refresh emails
  const refreshEmails = () => {
    localStorage.removeItem(CACHE_KEY);
    loadEmails();
  };

  const displayedEmails = isExpanded ? emails : emails.slice(0, displayCount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading emails with Phase 2 Intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <FaExclamationCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={refreshEmails} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <FaEnvelope className="h-4 w-4" />
            Inbox ({emails.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="flex-1 flex gap-4 mt-4">
          {/* Email List */}
          <Card className="w-1/2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">
                Phase 2 AI-Powered Email List
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshEmails}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="space-y-2 p-4">
                  {displayedEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedEmail?.id === email.id
                          ? 'border-purple-300 bg-purple-50 shadow-sm'
                          : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                      }`}
                      onClick={() => handleEmailSelect(email)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm truncate max-w-xs">
                          {email.from}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(email.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-medium mb-1 truncate">
                        {email.subject}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {email.body.substring(0, 100)}...
                      </div>
                      {!email.isRead && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 mt-2">
                          Unread
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {emails.length > displayCount && !isExpanded && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setIsExpanded(true)}
                    >
                      Show All {emails.length} Emails
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Email Detail and Actions */}
          <div className="flex-1">
            {selectedEmail ? (
              <div className="space-y-4">
                {/* Email Content */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">{selectedEmail.subject}</CardTitle>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>From:</strong> {selectedEmail.from}</div>
                          <div><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Phase 2 Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={handlePhase2Analysis}
                        disabled={isAnalyzing}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        size="sm"
                      >
                        {isAnalyzing ? (
                          <>
                            <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                            Phase 2 Analyzing...
                          </>
                        ) : (
                          <>
                            <FaBrain className="h-4 w-4 mr-2" />
                            Phase 2 Intelligence
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handlePhase2SalesAgent}
                        disabled={isSalesProcessing}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        size="sm"
                      >
                        {isSalesProcessing ? (
                          <>
                            <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                            Sales Processing...
                          </>
                        ) : (
                          <>
                            <FaRobot className="h-4 w-4 mr-2" />
                            Sales Agent V2
                          </>
                        )}
                      </Button>
                      {(phase2Intelligence || phase2SalesIntelligence) && (
                        <Button
                          onClick={() => {
                            setShowIntelligence(true);
                            setShowSalesIntelligence(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <FaChartLine className="h-4 w-4 mr-2" />
                          View Intelligence
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ScrollArea className="h-64">
                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {selectedEmail.body}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Generated Response Preview */}
                {generatedResponse && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-700 text-lg">
                        Phase 2 Generated Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {generatedResponse}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="h-full flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <FaBrain className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Phase 2 AI Intelligence Ready
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      Select an email to experience advanced behavioral evolution detection, 
                      industry-specific intelligence, and autonomous decision making.
                    </p>
                    <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-gray-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span>Behavioral Evolution</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span>Industry Intelligence</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Smart Decisions</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Phase 2 Intelligence Modal */}
      <Dialog open={showIntelligence} onOpenChange={setShowIntelligence}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaBrain className="h-5 w-5 text-purple-600" />
              Phase 2 Intelligence Analysis
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            {phase2Intelligence && (
              <Phase2IntelligenceDisplay
                intelligence={phase2Intelligence}
                isLoading={isAnalyzing}
                onActionSelect={(action: any) => {
                  console.log('Selected action:', action);
                  // Handle action selection
                }}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Phase 2 Sales Intelligence Modal */}
      <Dialog open={showSalesIntelligence} onOpenChange={setShowSalesIntelligence}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaRobot className="h-5 w-5 text-green-600" />
              Phase 2 Sales Intelligence
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            {phase2SalesIntelligence && (
              <div className="space-y-6">
                {/* Convert sales intelligence to display format */}
                <Phase2IntelligenceDisplay
                  intelligence={{
                    basic_analysis: {
                      sentiment: phase2SalesIntelligence.sales_analysis?.buying_intent || 'unknown',
                      urgency: phase2SalesIntelligence.response_strategy?.business_impact?.time_sensitivity || 'medium',
                      intent: phase2SalesIntelligence.sales_analysis?.sales_stage || 'discovery',
                      language_tone: 'sales_focused'
                    },
                    behavioral_evolution: phase2SalesIntelligence.evolution_intelligence,
                    industry_intelligence: phase2SalesIntelligence.industry_sales_context,
                    smart_decisions: phase2SalesIntelligence.response_strategy,
                    orchestration_intelligence: {
                      orchestration_id: 'sales-' + selectedEmail?.id,
                      success: true,
                      agents_activated: ['SalesAgentV2', 'CustomerSuccessAgent'],
                      evolution_detected: !!phase2SalesIntelligence.evolution_intelligence,
                      autonomous_actions_taken: 1,
                      requires_human_attention: phase2SalesIntelligence.response_strategy?.requires_approval || false,
                      confidence: phase2SalesIntelligence.response_strategy?.confidence_level || 0.8,
                      processing_time_ms: 2000
                    },
                    recommendations: phase2SalesIntelligence.recommendations,
                    analysis_metadata: phase2SalesIntelligence.analysis_metadata
                  }}
                  isLoading={isSalesProcessing}
                  onActionSelect={(action: any) => {
                    console.log('Selected sales action:', action);
                    // Handle sales action selection
                  }}
                />
                
                {/* Generated Response Section */}
                {generatedResponse && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-700">Generated Sales Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {generatedResponse}
                        </pre>
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(generatedResponse)}
                          >
                            Copy Response
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit Response
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
} 