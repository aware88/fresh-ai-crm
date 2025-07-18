'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  Bot, 
  Send, 
  Edit, 
  RefreshCw, 
  Check, 
  X, 
  MessageSquare,
  Brain,
  Lightbulb,
  Clock
} from 'lucide-react';

interface AIDraftData {
  id: string;
  subject: string;
  body: string;
  tone: string;
  confidence: number;
  generatedAt: Date;
  context: {
    originalEmail: string;
    senderInfo: any;
    previousContext: string;
  };
}

interface AIDraftWindowProps {
  emailId: string;
  originalEmail: {
    subject: string;
    body: string;
    from: string;
    to: string;
  };
  onSendDraft: (draftData: {
    subject: string;
    body: string;
    changes: Change[];
    userNotes?: string;
  }) => Promise<void>;
  onRegenerateDraft: () => Promise<void>;
  className?: string;
  position?: 'sidebar' | 'modal' | 'inline';
}

interface Change {
  type: 'added' | 'removed' | 'modified';
  section: 'subject' | 'body';
  original: string;
  modified: string;
  timestamp: Date;
}

export default function AIDraftWindow({
  emailId,
  originalEmail,
  onSendDraft,
  onRegenerateDraft,
  className = '',
  position = 'sidebar'
}: AIDraftWindowProps) {
  const [draftData, setDraftData] = useState<AIDraftData | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [saveNotes, setSaveNotes] = useState(true);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const { toast } = useToast();

  const originalSubjectRef = useRef<string>('');
  const originalBodyRef = useRef<string>('');

  // Load AI settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('aris-ai-email-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAiSettings(parsed);
        setSaveNotes(parsed.saveUserNotes || true);
      } catch (error) {
        console.warn('Failed to parse AI settings');
      }
    }
  }, []);

  // Generate initial draft
  useEffect(() => {
    if (emailId && originalEmail && (!draftData || aiSettings?.aiDraftAutoGenerate)) {
      generateDraft();
    }
  }, [emailId, originalEmail, aiSettings]);

  // Track changes when draft is edited
  useEffect(() => {
    if (draftData && (editedSubject || editedBody)) {
      const newChanges: Change[] = [];
      
      if (editedSubject !== originalSubjectRef.current) {
        newChanges.push({
          type: 'modified',
          section: 'subject',
          original: originalSubjectRef.current,
          modified: editedSubject,
          timestamp: new Date()
        });
      }
      
      if (editedBody !== originalBodyRef.current) {
        newChanges.push({
          type: 'modified',
          section: 'body',
          original: originalBodyRef.current,
          modified: editedBody,
          timestamp: new Date()
        });
      }
      
      setChanges(newChanges);
    }
  }, [editedSubject, editedBody, draftData]);

  const generateDraft = async () => {
    try {
      setIsGenerating(true);
      
      // Get AI settings for generating draft
      const settings = aiSettings || {
        responseStyle: 'professional',
        responseLength: 'detailed',
        includeContext: true
      };
      
      const response = await fetch('/api/emails/ai-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailId,
          originalEmail,
          settings
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate draft');
      }
      
      const data = await response.json();
      
      const newDraft: AIDraftData = {
        id: data.id,
        subject: data.subject,
        body: data.body,
        tone: data.tone || settings.responseStyle,
        confidence: data.confidence || 0.8,
        generatedAt: new Date(),
        context: {
          originalEmail: originalEmail.body,
          senderInfo: { email: originalEmail.from },
          previousContext: data.context || ''
        }
      };
      
      setDraftData(newDraft);
      setEditedSubject(newDraft.subject);
      setEditedBody(newDraft.body);
      
      // Store original values for change tracking
      originalSubjectRef.current = newDraft.subject;
      originalBodyRef.current = newDraft.body;
      
      toast({
        title: "Draft generated",
        description: "AI has prepared a draft reply for your review.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Error generating draft",
        description: "Failed to generate AI draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendDraft = async () => {
    if (!draftData) return;
    
    try {
      setIsSending(true);
      
      await onSendDraft({
        subject: editedSubject,
        body: editedBody,
        changes,
        userNotes: showNotes ? userNotes : undefined
      });
      
      // Save learning data if enabled
      if (aiSettings?.learningEnabled && aiSettings?.trackChanges) {
        await saveLearningData();
      }
      
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error sending draft:', error);
      toast({
        title: "Error sending email",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const saveLearningData = async () => {
    try {
      await fetch('/api/emails/ai-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailId,
          originalDraft: {
            subject: originalSubjectRef.current,
            body: originalBodyRef.current
          },
          finalDraft: {
            subject: editedSubject,
            body: editedBody
          },
          changes,
          userNotes: showNotes ? userNotes : undefined,
          draftId: draftData?.id
        })
      });
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  };

  const handleRegenerateDraft = async () => {
    await onRegenerateDraft();
    await generateDraft();
  };

  if (!draftData && !isGenerating) {
    return (
      <Card className={`${className} border-dashed border-2 border-gray-200`}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Bot className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Draft Assistant</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click to generate an AI-powered draft reply
          </p>
          <Button onClick={generateDraft} className="min-w-[120px]">
            <MessageSquare className="h-4 w-4 mr-2" />
            Generate Draft
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-muted-foreground">
            AI is generating your draft reply...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-l-4 border-l-blue-500`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-lg">AI Draft Reply</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {Math.round((draftData?.confidence || 0) * 100)}% confidence
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateDraft}
              disabled={isGenerating}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>Generated {draftData?.generatedAt.toLocaleTimeString()}</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {draftData?.tone}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subject Field */}
        <div className="space-y-2">
          <Label htmlFor="draft-subject">Subject</Label>
          <Input
            id="draft-subject"
            value={editedSubject}
            onChange={(e) => setEditedSubject(e.target.value)}
            placeholder="Email subject"
            className="font-medium"
          />
          {changes.some(c => c.section === 'subject') && (
            <div className="text-xs text-orange-600 flex items-center space-x-1">
              <Edit className="h-3 w-3" />
              <span>Modified from original</span>
            </div>
          )}
        </div>

        {/* Body Field */}
        <div className="space-y-2">
          <Label htmlFor="draft-body">Email Body</Label>
          <Textarea
            id="draft-body"
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            placeholder="Email body"
            className="min-h-[200px] resize-none"
            rows={8}
          />
          {changes.some(c => c.section === 'body') && (
            <div className="text-xs text-orange-600 flex items-center space-x-1">
              <Edit className="h-3 w-3" />
              <span>Modified from original</span>
            </div>
          )}
        </div>

        {/* User Notes Section */}
        {aiSettings?.saveUserNotes && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <Label htmlFor="show-notes">Add improvement notes</Label>
                </div>
                <Switch
                  id="show-notes"
                  checked={showNotes}
                  onCheckedChange={setShowNotes}
                />
              </div>
              
              {showNotes && (
                <div className="space-y-2">
                  <Textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Why did you make these changes? Help AI learn..."
                    className="min-h-[80px]"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-3 w-3" />
                    <span>These notes help AI improve future suggestions</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Change Summary */}
        {changes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Edit className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Changes Made</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {changes.map((change, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    <span>Modified {change.section}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setEditedSubject(originalSubjectRef.current);
              setEditedBody(originalBodyRef.current);
              setChanges([]);
              setUserNotes('');
            }}
            disabled={isSending}
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSendDraft}
            disabled={isSending || !editedSubject || !editedBody}
            className="min-w-[120px]"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 