'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  Mail, 
  Zap, 
  Clock, 
  CheckCircle, 
  Edit3,
  RefreshCw,
  Brain
} from 'lucide-react';

interface Draft {
  id: string;
  subject: string;
  body: string;
  confidence: number;
  tone: string;
  matched_patterns: string[];
  was_fallback: boolean;
  generated_at: string;
}

interface DraftMetadata {
  generation_cost_usd: number;
  generation_tokens: number;
  cache_hit: boolean;
  retrieval_time_ms: number;
}

export default function EmailDraftTest() {
  const { toast } = useToast();
  const [testEmailId, setTestEmailId] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [metadata, setMetadata] = useState<DraftMetadata | null>(null);
  const [source, setSource] = useState<'cache' | 'realtime' | 'fallback' | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const testDraftRetrieval = async () => {
    if (!testEmailId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email ID to test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setDraft(null);
    setMetadata(null);
    setSource(null);
    setFeedbackSent(false);

    try {
      const response = await fetch(`/api/email/draft?emailId=${encodeURIComponent(testEmailId)}`);
      
      if (response.ok) {
        const data = await response.json();
        setDraft(data.draft);
        setMetadata(data.metadata);
        setSource(data.source);
        setEditedSubject(data.draft.subject);
        setEditedBody(data.draft.body);
        
        toast({
          title: "Draft Retrieved!",
          description: `Retrieved from ${data.source} in ${data.metadata.retrieval_time_ms}ms`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.details || "Failed to retrieve draft",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing draft retrieval:', error);
      toast({
        title: "Error",
        description: "Failed to test draft retrieval",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (feedback: 'approved' | 'edited' | 'rejected') => {
    if (!draft) return;

    try {
      const response = await fetch('/api/email/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftId: draft.id,
          finalSubject: editedSubject,
          finalBody: editedBody,
          userFeedback: feedback,
          userNotes: feedback === 'edited' ? 'User made modifications' : ''
        })
      });

      if (response.ok) {
        setFeedbackSent(true);
        toast({
          title: "Feedback Sent!",
          description: `Marked as ${feedback}. This helps improve future drafts.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send feedback",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback",
        variant: "destructive"
      });
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'cache': return <Zap className="h-4 w-4 text-green-600" />;
      case 'realtime': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'fallback': return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getSourceDescription = (sourceType: string) => {
    switch (sourceType) {
      case 'cache': return 'Instant retrieval from background-generated cache';
      case 'realtime': return 'Generated in real-time using learned patterns';
      case 'fallback': return 'Generated using fallback AI system';
      default: return 'Unknown source';
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle>Email Draft Testing</CardTitle>
          </div>
          <CardDescription>
            Test the new learning-based email draft system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-id">Email ID to Test</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email-id"
                placeholder="Enter email ID (from emails table)"
                value={testEmailId}
                onChange={(e) => setTestEmailId(e.target.value)}
              />
              <Button 
                onClick={testDraftRetrieval}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Get Draft
              </Button>
            </div>
          </div>

          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium">Source</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getSourceIcon(source || '')}
                  <span className="text-sm capitalize">{source}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Speed</div>
                <div className="text-sm text-green-600 font-mono">
                  {metadata.retrieval_time_ms}ms
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Cache Hit</div>
                <div className="text-sm">
                  {metadata.cache_hit ? '✅' : '❌'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Cost</div>
                <div className="text-sm text-blue-600 font-mono">
                  ${metadata.generation_cost_usd.toFixed(4)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draft Results */}
      {draft && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSourceIcon(source || '')}
                <CardTitle>Generated Draft</CardTitle>
                <Badge variant="outline">
                  {Math.round(draft.confidence * 100)}% confidence
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                {getSourceDescription(source || '')}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pattern Information */}
            {draft.matched_patterns.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  Matched {draft.matched_patterns.length} learned pattern(s)
                </div>
                <div className="flex flex-wrap gap-1">
                  {draft.matched_patterns.map((patternId, index) => (
                    <Badge key={patternId} variant="secondary" className="text-xs">
                      Pattern {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {draft.was_fallback && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-800">
                  ⚠️ No learned patterns matched - used fallback AI generation
                </div>
              </div>
            )}

            {/* Editable Draft */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="draft-subject">Subject</Label>
                <Input
                  id="draft-subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="draft-body">Body</Label>
                <Textarea
                  id="draft-body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={10}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Feedback Buttons */}
            {!feedbackSent && (
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => sendFeedback('approved')}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
                <Button 
                  onClick={() => sendFeedback('edited')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Save Edits
                </Button>
                <Button 
                  onClick={() => sendFeedback('rejected')}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}

            {feedbackSent && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-800">
                  ✅ Feedback sent! This helps improve future draft quality.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>1. Setup:</strong> First run the database schema (email-learning-schema.sql)</p>
            <p><strong>2. Learning:</strong> Go to Settings → Email Learning and run initial learning</p>
            <p><strong>3. Test Draft:</strong> Enter an email ID from your emails table above</p>
            <p><strong>4. Observe:</strong> See if it uses cached drafts, patterns, or fallback AI</p>
            <p><strong>5. Feedback:</strong> Approve/edit/reject to help the system learn</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Expected Behavior:</strong> First-time drafts will be "realtime" or "fallback". 
              After background processing, subsequent requests should be "cache" with instant retrieval.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


