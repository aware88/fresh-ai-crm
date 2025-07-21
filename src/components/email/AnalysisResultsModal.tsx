import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { User, Brain, Target, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Lightbulb, Clock, Save, UserPlus, Mail, PenTool } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Loading Modal Component
export function AnalysisLoadingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
            AI Analysis in Progress
          </DialogTitle>
          <DialogDescription>
            <span className="block">Our AI is analyzing your email...</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Analyzing personality traits...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse animation-delay-200"></div>
              <span className="text-sm text-gray-600">Understanding communication style...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse animation-delay-400"></div>
              <span className="text-sm text-gray-600">Extracting key insights...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse animation-delay-600"></div>
              <span className="text-sm text-gray-600">Generating recommendations...</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-purple-600 font-medium">This may take a few moments...</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AnalysisResult {
  analysis: {
    personality: {
      traits: string[];
      communication_style: string;
      tone: string;
    };
    context: {
      relationship_type: string;
      urgency_level: string;
      topic_category: string;
    };
    insights: {
      key_points: string[];
      sentiment: string;
      intent: string;
    };
    recommendations: {
      response_suggestions: string[];
      next_steps: string[];
    };
  };
  error?: string;
  note?: string;
}

interface AnalysisResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  emailInfo: {
    from: string;
    subject: string;
    body?: string;
  };
}

export const AnalysisResultsModal: React.FC<AnalysisResultsModalProps> = ({
  isOpen,
  onClose,
  result,
  emailInfo
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const { toast } = useToast();
  
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
          analysisResult: result,
          salesResult: null // Only AI analysis for this modal
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Analysis Saved!",
          description: data.message,
        });
      } else {
        toast({
          title: "Save Failed",
          description: data.error || 'Failed to save analysis to contact',
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

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      // For now, just show a message about using the existing AI draft system
      toast({
        title: "AI Draft Ready!",
        description: `Use the AI Draft Assistant in your email client to generate a personalized response based on this personality analysis.`,
      });
      
      // In the future, this would integrate with the existing AIDraftWindow
      // by opening it in a new tab or embedding it in the current view
      
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Error",
        description: 'An error occurred while generating draft response',
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Provide safe defaults for all nested properties
  const analysis = result.analysis || {};
  const personality = analysis.personality || {};
  const context = analysis.context || {};
  const insights = analysis.insights || {};
  const recommendations = analysis.recommendations || {};

  // Safe getters with defaults
  const traits = personality.traits || [];
  const communicationStyle = personality.communication_style || 'Unknown';
  const tone = personality.tone || 'Unknown';
  
  const relationshipType = context.relationship_type || 'Unknown';
  const urgencyLevel = context.urgency_level || 'Medium';
  const topicCategory = context.topic_category || 'General';
  
  const keyPoints = insights.key_points || [];
  const sentiment = insights.sentiment || 'Unknown';
  const intent = insights.intent || 'Unknown';
  
  const responseSuggestions = recommendations.response_suggestions || [];
  const nextSteps = recommendations.next_steps || [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Email Analysis Complete
              </DialogTitle>
              <DialogDescription>
                <span className="block mb-1"><strong>From:</strong> {emailInfo.from}</span>
                <span className="block"><strong>Subject:</strong> {emailInfo.subject}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerateDraft}
                disabled={isGeneratingDraft}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {isGeneratingDraft ? (
                  <>
                    <PenTool className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Draft Response
                  </>
                )}
              </Button>

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

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Error or Note Display */}
            {result.error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
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

            {/* Personality Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personality Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Personality Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {traits.length > 0 ? (
                      traits.map((trait, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {trait}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        No traits identified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Communication Style</h4>
                    <p className="text-sm text-gray-600">{communicationStyle}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Tone</h4>
                    <p className="text-sm text-gray-600">{tone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Context Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Context Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Relationship Type</h4>
                    <Badge variant="outline">{relationshipType}</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Urgency Level</h4>
                    <Badge className={getUrgencyColor(urgencyLevel)}>
                      {urgencyLevel}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Topic Category</h4>
                    <Badge variant="outline">{topicCategory}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Points</h4>
                  {keyPoints.length > 0 ? (
                    <ul className="space-y-1">
                      {keyPoints.map((point, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No key points identified</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Sentiment</h4>
                    <Badge className={getSentimentColor(sentiment)}>
                      {sentiment}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Intent</h4>
                    <p className="text-sm text-gray-600">{intent}</p>
                  </div>
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
                  <h4 className="font-medium mb-2">Response Suggestions</h4>
                  {responseSuggestions.length > 0 ? (
                    <div className="space-y-2">
                      {responseSuggestions.map((suggestion, index) => (
                        <div key={index} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-800">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No response suggestions available</p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Next Steps</h4>
                  {nextSteps.length > 0 ? (
                    <ul className="space-y-1">
                      {nextSteps.map((step, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No next steps available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 