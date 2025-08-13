'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Mail, 
  PenTool, 
  Brain, 
  Shield, 
  Zap,
  HelpCircle,
  Settings,
  MessageSquare
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AIEmailPreferencesChat from '@/components/email/AIEmailPreferencesChat';

interface AIEmailSettings {
  // AI Draft Assistant
  aiDraftEnabled: boolean;
  aiDraftAutoGenerate: boolean;
  aiDraftPosition: 'sidebar' | 'modal' | 'inline';
  
  // Response Settings
  responseStyle: 'professional' | 'friendly' | 'formal' | 'casual';
  responseLength: 'concise' | 'detailed' | 'custom';
  includeContext: boolean;
  
  // Learning Settings
  learningEnabled: boolean;
  trackChanges: boolean;
  saveUserNotes: boolean;
  
  // Privacy Settings
  dataRetention: 'forever' | '1year' | '6months' | '3months';
  shareForImprovement: boolean;
  // Auto Reply
  autoReplyMode?: 'semi' | 'full';
  autoReplyConfidenceThreshold?: number; // 0..1
}

export default function AIEmailSettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [settings, setSettings] = useState<AIEmailSettings>({
    aiDraftEnabled: false,
    aiDraftAutoGenerate: true,
    aiDraftPosition: 'sidebar',
    responseStyle: 'professional',
    responseLength: 'detailed',
    includeContext: true,
    learningEnabled: true,
    trackChanges: true,
    saveUserNotes: true,
    dataRetention: '1year',
    shareForImprovement: false,
    autoReplyMode: 'semi',
    autoReplyConfidenceThreshold: 0.9
  });
  const [initialSettings, setInitialSettings] = useState<AIEmailSettings>({
    aiDraftEnabled: false,
    aiDraftAutoGenerate: true,
    aiDraftPosition: 'sidebar',
    responseStyle: 'professional',
    responseLength: 'detailed',
    includeContext: true,
    learningEnabled: true,
    trackChanges: true,
    saveUserNotes: true,
    dataRetention: '1year',
    shareForImprovement: false,
    autoReplyMode: 'semi',
    autoReplyConfidenceThreshold: 0.9
  });

  // Load settings from localStorage and database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // Load from localStorage first
        const savedSettings = localStorage.getItem('aris-ai-email-settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setSettings(parsed);
            setInitialSettings(parsed);
          } catch (error) {
            console.warn('Failed to parse saved AI email settings');
          }
        }
        
        // Try to load from database
        if (session?.user?.id) {
          const supabase = createClientComponentClient();
          const { data: userSettings, error } = await supabase
            .from('user_ai_email_settings')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (!error && userSettings) {
            const loadedSettings = {
              aiDraftEnabled: userSettings.ai_draft_enabled || false,
              aiDraftAutoGenerate: userSettings.ai_draft_auto_generate || true,
              aiDraftPosition: userSettings.ai_draft_position || 'sidebar',
              responseStyle: userSettings.response_style || 'professional',
              responseLength: userSettings.response_length || 'detailed',
              includeContext: userSettings.include_context || true,
              learningEnabled: userSettings.learning_enabled || true,
              trackChanges: userSettings.track_changes || true,
              saveUserNotes: userSettings.save_user_notes || true,
              dataRetention: userSettings.data_retention || '1year',
              shareForImprovement: userSettings.share_for_improvement || false,
              autoReplyMode: (userSettings.auto_reply_mode as 'semi' | 'full') || 'semi',
              autoReplyConfidenceThreshold: typeof userSettings.auto_reply_confidence_threshold === 'number' 
                ? userSettings.auto_reply_confidence_threshold 
                : 0.9
            };
            setSettings(loadedSettings);
            setInitialSettings(loadedSettings);
          }
        }
      } catch (error) {
        console.error('Error loading AI email settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [session?.user?.id]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage immediately
      localStorage.setItem('aris-ai-email-settings', JSON.stringify(settings));
      
      // Try to save to database
      if (session?.user?.id) {
        const supabase = createClientComponentClient();
        const { error } = await supabase
          .from('user_ai_email_settings')
          .upsert({
            user_id: session.user.id,
            ai_draft_enabled: settings.aiDraftEnabled,
            ai_draft_auto_generate: settings.aiDraftAutoGenerate,
            ai_draft_position: settings.aiDraftPosition,
            response_style: settings.responseStyle,
            response_length: settings.responseLength,
            include_context: settings.includeContext,
            learning_enabled: settings.learningEnabled,
            track_changes: settings.trackChanges,
            save_user_notes: settings.saveUserNotes,
            data_retention: settings.dataRetention,
            share_for_improvement: settings.shareForImprovement,
            auto_reply_mode: settings.autoReplyMode || 'semi',
            auto_reply_confidence_threshold: settings.autoReplyConfidenceThreshold ?? 0.9,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.warn('Failed to save to database, using localStorage:', error.message);
        }
      }
      
      // Update initial settings and reset change tracking
      setInitialSettings(settings);
      setHasChanges(false);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      toast({
        title: "Settings saved",
        description: "Your AI email settings have been saved successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving AI email settings:', error);
      toast({
        title: "Error saving settings",
        description: "Settings were saved locally but may not sync across devices.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = useCallback((key: keyof AIEmailSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Check if settings have changed from initial values
      setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(initialSettings));
      // Hide success message when user makes changes
      setShowSuccessMessage(false);
      return newSettings;
    });
  }, [initialSettings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <h1 className="text-2xl font-bold">AI Email Settings</h1>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Bot className="h-5 w-5" />
        <h1 className="text-2xl font-bold">AI Email Settings</h1>
        <Badge variant="secondary">Beta</Badge>
      </div>
      
      <p className="text-muted-foreground">
        Configure how AI assists with your email responses. AI will prepare draft replies that you can review and edit before sending.
      </p>

      {/* Conversational Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <CardTitle>Conversational Setup</CardTitle>
          </div>
          <CardDescription>
            Configure your email preferences by talking to AI - tell it how you want emails handled, which ones to skip, and what tone to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIEmailPreferencesChat />
        </CardContent>
      </Card>

      {/* AI Draft Assistant */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PenTool className="h-4 w-4" />
            <CardTitle>AI Draft Assistant</CardTitle>
          </div>
          <CardDescription>
            Let AI prepare email drafts for you to review and edit before sending. The conversational setup above controls how these drafts are generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-reply-mode">Auto-reply mode</Label>
              <div className="text-sm text-muted-foreground">
                Semi-auto requires approval. Full-auto sends high-confidence replies automatically.
              </div>
            </div>
            <Select 
              value={settings.autoReplyMode || 'semi'}
              onValueChange={(value) => updateSetting('autoReplyMode', value as any)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semi">Semi-auto (default)</SelectItem>
                <SelectItem value="full">Full-auto (with review queue)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.autoReplyMode === 'full' && (
            <div className="space-y-2">
              <Label htmlFor="auto-reply-threshold">Auto-reply confidence threshold</Label>
              <div className="text-sm text-muted-foreground">Only auto-send when AI confidence ≥ threshold</div>
              <Select
                value={String(settings.autoReplyConfidenceThreshold || 0.9)}
                onValueChange={(value) => updateSetting('autoReplyConfidenceThreshold', Number(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select threshold" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8">80%</SelectItem>
                  <SelectItem value="0.85">85%</SelectItem>
                  <SelectItem value="0.9">90% (Recommended)</SelectItem>
                  <SelectItem value="0.95">95%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-draft-enabled">Enable AI Draft Assistant</Label>
              <div className="text-sm text-muted-foreground">
                Automatically generate draft responses for incoming emails
              </div>
            </div>
            <Switch
              id="ai-draft-enabled"
              checked={settings.aiDraftEnabled}
              onCheckedChange={(checked) => updateSetting('aiDraftEnabled', checked)}
            />
          </div>

          {settings.aiDraftEnabled && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-generate">Auto-generate drafts</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically create drafts when new emails arrive
                  </div>
                </div>
                <Switch
                  id="auto-generate"
                  checked={settings.aiDraftAutoGenerate}
                  onCheckedChange={(checked) => updateSetting('aiDraftAutoGenerate', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="draft-position">Draft display position</Label>
                <Select 
                  value={settings.aiDraftPosition} 
                  onValueChange={(value) => updateSetting('aiDraftPosition', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sidebar">Side panel</SelectItem>
                    <SelectItem value="modal">Modal dialog</SelectItem>
                    <SelectItem value="inline">Inline with email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Response Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <CardTitle>Response Settings</CardTitle>
            </div>
            <Badge variant="outline">Alternative to AI Chat</Badge>
          </div>
          <CardDescription>
            Control how AI generates email responses. Note: You can also configure these settings by talking to the AI chat above (e.g., "Use a professional tone" or "Keep responses brief").
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="response-style">Response style</Label>
            <Select 
              value={settings.responseStyle} 
              onValueChange={(value) => updateSetting('responseStyle', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response-length">Response length</Label>
            <Select 
              value={settings.responseLength} 
              onValueChange={(value) => updateSetting('responseLength', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-context">Include conversation context</Label>
              <div className="text-sm text-muted-foreground">
                Use previous messages to inform responses
              </div>
            </div>
            <Switch
              id="include-context"
              checked={settings.includeContext}
              onCheckedChange={(checked) => updateSetting('includeContext', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <CardTitle>Learning & Improvement</CardTitle>
          </div>
          <CardDescription>
            Help AI learn from your preferences and improve over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="learning-enabled">Enable learning</Label>
              <div className="text-sm text-muted-foreground">
                Allow AI to learn from your email patterns and preferences
              </div>
            </div>
            <Switch
              id="learning-enabled"
              checked={settings.learningEnabled}
              onCheckedChange={(checked) => updateSetting('learningEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="track-changes">Track changes</Label>
              <div className="text-sm text-muted-foreground">
                Save what you edit to improve AI suggestions
              </div>
            </div>
            <Switch
              id="track-changes"
              checked={settings.trackChanges}
              onCheckedChange={(checked) => updateSetting('trackChanges', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="save-notes">Save improvement notes</Label>
              <div className="text-sm text-muted-foreground">
                Allow adding notes about why you made changes
              </div>
            </div>
            <Switch
              id="save-notes"
              checked={settings.saveUserNotes}
              onCheckedChange={(checked) => updateSetting('saveUserNotes', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <CardTitle>Privacy & Data</CardTitle>
          </div>
          <CardDescription>
            Control how your data is used for AI improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="data-retention">Data retention</Label>
            <div className="text-sm text-muted-foreground mb-2">
              How long to keep learning data for AI improvements
            </div>
            <Select 
              value={settings.dataRetention} 
              onValueChange={(value) => updateSetting('dataRetention', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 months</SelectItem>
                <SelectItem value="6months">6 months</SelectItem>
                <SelectItem value="1year">1 year (Recommended)</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-improvement">Share for improvement</Label>
              <div className="text-sm text-muted-foreground">
                Help improve AI for all users (anonymized data only)
              </div>
            </div>
            <Switch
              id="share-improvement"
              checked={settings.shareForImprovement}
              onCheckedChange={(checked) => updateSetting('shareForImprovement', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
            <CardTitle>How It Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">1</div>
              <div>
                <strong>AI analyzes the email</strong> and your previous responses to understand context and tone
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">2</div>
              <div>
                <strong>Draft appears in side panel</strong> where you can review and edit it
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">3</div>
              <div>
                <strong>You edit and send</strong> the email with full control
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">4</div>
              <div>
                <strong>AI learns from your changes</strong> to improve future suggestions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Settings saved successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saving || !hasChanges}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 