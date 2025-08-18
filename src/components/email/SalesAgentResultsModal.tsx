import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, DollarSign, Clock, User, AlertTriangle, CheckCircle, Star, Lightbulb, MessageSquare, Save, UserPlus, Mail, PenTool, ExternalLink, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AIDraftWindow from './AIDraftWindow';
import { AIResponseRating } from '@/components/ui/ai-response-rating';

// Loading Modal Component
export function SalesAgentLoadingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 animate-pulse" />
            Sales Agent Processing
          </DialogTitle>
          <DialogDescription>
            <span className="block">Our sales AI is analyzing this opportunity...</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Qualifying lead potential...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse animation-delay-200"></div>
              <span className="text-sm text-gray-600">Assessing opportunity value...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse animation-delay-400"></div>
              <span className="text-sm text-gray-600">Identifying buying signals...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse animation-delay-600"></div>
              <span className="text-sm text-gray-600">Creating action plan...</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Preparing your sales strategy...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SalesAnalysisResult {
  analysis: {
    lead_qualification: {
      score: number;
      level: string;
      reasoning: string;
    };
    opportunity_assessment: {
      potential_value: string;
      timeline: string;
      decision_maker: string;
      budget_indicators: string[];
    };
    sales_insights: {
      pain_points: string[];
      buying_signals: string[];
      objection_likelihood: string;
    };
    recommendations: {
      next_actions: string[];
      approach: string;
      urgency: string;
    };
  };
  error?: string;
  note?: string;
}

interface SalesAgentResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SalesAnalysisResult | null;
  emailInfo: {
    from: string;
    subject: string;
    body?: string;
  };
}

export const SalesAgentResultsModal: React.FC<SalesAgentResultsModalProps> = ({
  isOpen,
  onClose,
  result,
  emailInfo
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showDraftWindow, setShowDraftWindow] = useState(true); // Start with draft immediately
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false); // Hide analysis by default
  const { toast } = useToast();
  
  // Auto-store sales context when component loads (analysis data available for draft)
  useEffect(() => {
    if (result) {
      localStorage.setItem('sales-context-temp', JSON.stringify(result));
    }
  }, [result]);
  
  if (!result) return null;

  const handleSaveToContact = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/contacts/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailInfo,
          analysisResult: null, // No AI analysis for this modal
          salesResult: result
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sales Analysis Saved!",
          description: data.message,
        });
      } else {
        toast({
          title: "Save Failed",
          description: data.error || 'Failed to save sales analysis to contact',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving to contact:', error);
      toast({
        title: "Error",
        description: 'An error occurred while saving to contact',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendDraft = async (draftData: {
    subject: string;
    body: string;
    changes: any[];
    userNotes?: string;
    attachments?: { name: string; contentType: string; contentBytes: string }[];
  }) => {
    try {
      console.log('Sending sales draft with context:', draftData);
      
      // Prepare email payload
      const emailPayload = {
        subject: draftData.subject,
        contentType: 'HTML',
        content: draftData.body,
        toRecipients: [emailInfo.from],
        attachments: draftData.attachments || []
      };

      // Try to send via the email API
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send email: ${response.statusText}`);
      }

      toast({
        title: "Sales Email Sent!",
        description: `Your personalized response has been sent to ${emailInfo.from}`,
      });
      
      // Close the modal after sending
      onClose();
      
    } catch (error) {
      console.error('Error sending draft:', error);
      toast({
        title: "Email Send Failed",
        description: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        variant: "destructive",
      });
      throw error; // Let AIDraftWindow handle the error too
    }
  };

  const handleRegenerateDraft = async () => {
    try {
      console.log('Regenerating draft with sales context');
      // The AIDraftWindow will handle regeneration automatically
    } catch (error) {
      console.error('Error regenerating draft:', error);
      throw error;
    }
  };

  // Provide safe defaults for all nested properties
  const analysis = result.analysis || {};
  const leadQualification = analysis.lead_qualification || {};
  const opportunityAssessment = analysis.opportunity_assessment || {};
  const salesInsights = analysis.sales_insights || {};
  const recommendations = analysis.recommendations || {};

  // Safe getters with defaults
  const score = leadQualification.score || 0;
  const level = leadQualification.level || 'Unknown';
  const reasoning = leadQualification.reasoning || 'No reasoning provided';
  
  const potentialValue = opportunityAssessment.potential_value || 'Unknown';
  const timeline = opportunityAssessment.timeline || 'Unknown';
  const decisionMaker = opportunityAssessment.decision_maker || 'Unknown';
  const budgetIndicators = opportunityAssessment.budget_indicators || [];
  
  const painPoints = salesInsights.pain_points || [];
  const buyingSignals = salesInsights.buying_signals || [];
  const objectionLikelihood = salesInsights.objection_likelihood || 'Unknown';
  
  const nextActions = recommendations.next_actions || [];
  const approach = recommendations.approach || 'Unknown';
  const urgency = recommendations.urgency || 'Medium';

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValueColor = (value: string) => {
    switch (value.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline.toLowerCase()) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'short-term': return 'bg-yellow-100 text-yellow-800';
      case 'long-term': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${showAnalysisDetails ? 'max-w-7xl' : 'max-w-5xl'} h-[95vh] flex flex-col overflow-hidden`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Sales Agent Analysis Complete
              </DialogTitle>
              <DialogDescription>
                <span className="block mb-1"><strong>From:</strong> {emailInfo.from}</span>
                <span className="block"><strong>Subject:</strong> {emailInfo.subject}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {showDraftWindow && (
                <Button
                  onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
                  variant="outline"
                  size="sm"
                >
                  {showAnalysisDetails ? (
                    <>
                      <PenTool className="h-4 w-4 mr-2" />
                      Hide Analysis
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analysis
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleSaveToContact}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Save to Contact
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className={`min-h-0 flex-1 ${showAnalysisDetails ? 'flex gap-4' : ''}`}>
          {/* AI Draft Window - Primary Focus */}
          <div className={`${showAnalysisDetails ? 'flex-1' : 'w-full'} h-full`}>
            <AIDraftWindow
              emailId={`sales-${Date.now()}`}
              originalEmail={{
                subject: emailInfo.subject || 'Sales Follow-up',
                body: emailInfo.body || 'Original email content',
                from: emailInfo.from || 'unknown@example.com',
                to: 'user@company.com'
              }}
              onSendDraft={handleSendDraft}
              onRegenerateDraft={handleRegenerateDraft}
              className="h-full"
              position="inline"
            />
          </div>
          
          {/* Analysis Section - Collapsible Sidebar */}
          {showAnalysisDetails && (
            <div className="w-80 h-full flex flex-col border-l bg-gray-50">
              <div className="px-4 py-2 bg-gray-100 border-b">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sales Analysis
                </h3>
              </div>
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-4 p-4">
            {/* Error or Note Display */}
            {result.error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Error:</span>
                    <span>{result.error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.note && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Note:</span>
                    <span>{result.note}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lead Qualification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Lead Qualification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Qualification Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                        {score}/10
                      </span>
                    </div>
                    <Progress 
                      value={score * 10} 
                      className="h-2"
                    />
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {level}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Reasoning</h4>
                  <p className="text-sm text-gray-600">{reasoning}</p>
                </div>
              </CardContent>
            </Card>

            {/* Opportunity Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Opportunity Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Potential Value</h4>
                    <Badge className={getValueColor(potentialValue)}>
                      {potentialValue}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <Badge className={getTimelineColor(timeline)}>
                      {timeline}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Decision Maker Status</h4>
                  <p className="text-sm text-gray-600">{decisionMaker}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Budget Indicators</h4>
                  {budgetIndicators.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {budgetIndicators.map((indicator, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No budget indicators identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Sales Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Pain Points</h4>
                  {painPoints.length > 0 ? (
                    <ul className="space-y-1">
                      {painPoints.map((point, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No pain points identified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Buying Signals</h4>
                  {buyingSignals.length > 0 ? (
                    <ul className="space-y-1">
                      {buyingSignals.map((signal, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                          {signal}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No buying signals identified</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Objection Likelihood</h4>
                  <Badge className={getValueColor(objectionLikelihood)}>
                    {objectionLikelihood}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Next Actions</h4>
                  {nextActions.length > 0 ? (
                    <div className="space-y-2">
                      {nextActions.map((action, index) => (
                        <div key={index} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-800">{action}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No next actions recommended</p>
                  )}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Approach Strategy</h4>
                    <p className="text-sm text-gray-600">{approach}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Priority</h4>
                    <Badge className={getUrgencyColor(urgency)}>
                      {urgency}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* AI Response Rating */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4">
          <AIResponseRating
            responseId={`sales-${Date.now()}`}
            modelUsed="gpt-4o-mini"
            taskType="sales_analysis"
            className="justify-center"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 