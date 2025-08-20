'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Wand2, 
  Copy, 
  Send, 
  Edit, 
  RefreshCw,
  Sparkles,
  MessageSquare,
  Clock,
  Star,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmailFollowup } from '@/lib/email/follow-up-service';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface AIDraftGeneratorProps {
  followup: EmailFollowup;
  onDraftGenerated?: (draft: any) => void;
  onDraftSent?: (draft: any) => void;
  className?: string;
}

interface DraftOptions {
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  approach: 'gentle' | 'direct' | 'value-add' | 'alternative';
  maxLength: 'short' | 'medium' | 'long';
  language: string;
  customInstructions?: string;
  includeOriginalContext: boolean;
}

interface GeneratedDraft {
  subject: string;
  body: string;
  tone: string;
  approach: string;
  confidence: number;
  reasoning: string;
}

export default function AIDraftGenerator({
  followup,
  onDraftGenerated,
  onDraftSent,
  className
}: AIDraftGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedDraft[]>([]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<GeneratedDraft | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [options, setOptions] = useState<DraftOptions>({
    tone: 'professional',
    approach: 'gentle',
    maxLength: 'medium',
    language: 'English',
    includeOriginalContext: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/email/followups/templates?limit=10');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generateDraft = async (generateVariations = false) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/email/followups/${followup.id}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          generateVariations
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft');
      }

      const result = await response.json();

      if (result.success) {
        if (generateVariations && result.variations) {
          setGeneratedDrafts(result.variations);
        } else if (result.draft) {
          setGeneratedDrafts([result.draft]);
        }
        setSelectedDraftIndex(0);
        setIsEditing(false);
        setEditedDraft(null);

        if (onDraftGenerated) {
          onDraftGenerated(result);
        }

        toast({
          title: 'Draft Generated',
          description: `AI has generated ${generateVariations ? result.variations?.length || 0 : 1} follow-up draft${generateVariations ? 's' : ''}`
        });
      } else {
        throw new Error(result.error || 'Failed to generate draft');
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI draft. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyDraft = (draft: GeneratedDraft) => {
    const fullEmail = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(fullEmail);
    toast({
      title: 'Copied',
      description: 'Draft copied to clipboard'
    });
  };

  const startEditing = () => {
    const currentDraft = generatedDrafts[selectedDraftIndex];
    setEditedDraft({ ...currentDraft });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editedDraft) {
      const newDrafts = [...generatedDrafts];
      newDrafts[selectedDraftIndex] = editedDraft;
      setGeneratedDrafts(newDrafts);
      setIsEditing(false);
      setEditedDraft(null);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedDraft(null);
  };

  const sendDraft = async (draft: GeneratedDraft) => {
    try {
      // Here you would integrate with the email sending system
      // For now, we'll just simulate the action
      toast({
        title: 'Draft Ready',
        description: 'Draft is ready to be sent via email composer'
      });

      if (onDraftSent) {
        onDraftSent(draft);
      }
    } catch (error) {
      console.error('Error preparing draft for sending:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare draft for sending',
        variant: 'destructive'
      });
    }
  };

  const applyTemplate = (template: any) => {
    // Apply template settings to options
    setOptions(prev => ({
      ...prev,
      tone: template.tone,
      approach: template.approach
    }));

    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template settings`
    });
  };

  const currentDraft = isEditing ? editedDraft : generatedDrafts[selectedDraftIndex];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Draft Generator
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Phase 2
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Tone</Label>
            <Select
              value={options.tone}
              onValueChange={(value) => setOptions(prev => ({ ...prev, tone: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Approach</Label>
            <Select
              value={options.approach}
              onValueChange={(value) => setOptions(prev => ({ ...prev, approach: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Gentle</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="value-add">Value-Add</SelectItem>
                <SelectItem value="alternative">Alternative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Length</Label>
            <Select
              value={options.maxLength}
              onValueChange={(value) => setOptions(prev => ({ ...prev, maxLength: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Language</Label>
            <Select
              value={options.language}
              onValueChange={(value) => setOptions(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
                <SelectItem value="Italian">Italian</SelectItem>
                <SelectItem value="Slovenian">Slovenian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-sm text-gray-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Options
            {showAdvancedOptions ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>

          <AnimatePresence>
            {showAdvancedOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm">Custom Instructions</Label>
                  <Textarea
                    placeholder="Add specific instructions for the AI (e.g., mention a specific product, include a deadline, etc.)"
                    value={options.customInstructions || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, customInstructions: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeContext"
                    checked={options.includeOriginalContext}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeOriginalContext: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeContext" className="text-sm">
                    Include original email context
                  </Label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {templates.slice(0, 5).map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Generation Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => generateDraft(false)}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate Draft
          </Button>

          <Button
            onClick={() => generateDraft(true)}
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Generate Variations
          </Button>
        </div>

        {/* Generated Drafts */}
        {generatedDrafts.length > 0 && (
          <div className="space-y-4">
            <Separator />
            
            {/* Draft Selection */}
            {generatedDrafts.length > 1 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Draft:</Label>
                <div className="flex gap-1">
                  {generatedDrafts.map((_, index) => (
                    <Button
                      key={index}
                      variant={index === selectedDraftIndex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDraftIndex(index)}
                      className="w-8 h-8 p-0"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Draft Display */}
            {currentDraft && (
              <Card className="bg-gray-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {currentDraft.tone}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {currentDraft.approach}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">
                            {Math.round(currentDraft.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      {currentDraft.reasoning && (
                        <p className="text-xs text-gray-600 italic">
                          {currentDraft.reasoning}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyDraft(currentDraft)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={isEditing ? saveEdit : startEditing}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subject</Label>
                    {isEditing ? (
                      <Input
                        value={editedDraft?.subject || ''}
                        onChange={(e) => setEditedDraft(prev => 
                          prev ? { ...prev, subject: e.target.value } : null
                        )}
                      />
                    ) : (
                      <div className="p-3 bg-white rounded border text-sm">
                        {currentDraft.subject}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Message</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedDraft?.body || ''}
                        onChange={(e) => setEditedDraft(prev => 
                          prev ? { ...prev, body: e.target.value } : null
                        )}
                        rows={8}
                      />
                    ) : (
                      <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                        {currentDraft.body}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {isEditing ? (
                      <>
                        <Button onClick={saveEdit} size="sm">
                          Save Changes
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => sendDraft(currentDraft)}
                          className="flex-1"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Use This Draft
                        </Button>
                        <Button
                          onClick={() => generateDraft(false)}
                          variant="outline"
                          disabled={isGenerating}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Context Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-900">Follow-up Context</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Original:</strong> {followup.original_subject}</p>
                  <p><strong>Recipients:</strong> {followup.original_recipients.join(', ')}</p>
                  <p><strong>Priority:</strong> {followup.priority}</p>
                  <p><strong>Reason:</strong> {followup.follow_up_reason}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
