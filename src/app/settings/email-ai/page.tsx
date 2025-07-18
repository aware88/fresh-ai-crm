'use client';

import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
}

export default function AIEmailSettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    shareForImprovement: false
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
            setSettings({
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
              shareForImprovement: userSettings.share_for_improvement || false
            });
          }
        }
      } catch (error) {
        console.error('Error loading AI email settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [session]);

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
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.warn('Failed to save to database, using localStorage:', error.message);
        }
      }
      
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

  const updateSetting = (key: keyof AIEmailSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

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

      {/* AI Draft Assistant */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PenTool className="h-4 w-4" />
            <CardTitle>AI Draft Assistant</CardTitle>
          </div>
          <CardDescription>
            Let AI prepare email drafts for you to review and edit before sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-draft-enabled">Enable AI Draft Assistant</Label>
              <p className="text-sm text-muted-foreground">
                AI will prepare draft replies in a side panel for you to review
              </p>
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
                <div className="space-y-1">
                  <Label htmlFor="ai-draft-auto">Auto-generate drafts</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate drafts when viewing emails
                  </p>
                </div>
                <Switch
                  id="ai-draft-auto"
                  checked={settings.aiDraftAutoGenerate}
                  onCheckedChange={(checked) => updateSetting('aiDraftAutoGenerate', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="draft-position">Draft panel position</Label>
                <Select 
                  value={settings.aiDraftPosition} 
                  onValueChange={(value) => updateSetting('aiDraftPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sidebar">Sidebar (Recommended)</SelectItem>
                    <SelectItem value="modal">Modal dialog</SelectItem>
                    <SelectItem value="inline">Inline below email</SelectItem>
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
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <CardTitle>Response Settings</CardTitle>
          </div>
          <CardDescription>
            Customize how AI generates email responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="response-style">Response style</Label>
              <Select 
                value={settings.responseStyle} 
                onValueChange={(value) => updateSetting('responseStyle', value)}
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
                onValueChange={(value) => updateSetting('responseLength', value)}
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
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="include-context">Include conversation context</Label>
              <p className="text-sm text-muted-foreground">
                AI will consider previous emails in the conversation
              </p>
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
            Help AI learn from your editing patterns to improve future suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="learning-enabled">Enable learning</Label>
              <p className="text-sm text-muted-foreground">
                AI will learn from your edits to improve future drafts
              </p>
            </div>
            <Switch
              id="learning-enabled"
              checked={settings.learningEnabled}
              onCheckedChange={(checked) => updateSetting('learningEnabled', checked)}
            />
          </div>
          
          {settings.learningEnabled && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="track-changes">Track changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Save what you edit to improve AI suggestions
                  </p>
                </div>
                <Switch
                  id="track-changes"
                  checked={settings.trackChanges}
                  onCheckedChange={(checked) => updateSetting('trackChanges', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="save-notes">Save improvement notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow adding notes about why you made changes
                  </p>
                </div>
                <Switch
                  id="save-notes"
                  checked={settings.saveUserNotes}
                  onCheckedChange={(checked) => updateSetting('saveUserNotes', checked)}
                />
              </div>
            </>
          )}
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data-retention">Data retention</Label>
            <Select 
              value={settings.dataRetention} 
              onValueChange={(value) => updateSetting('dataRetention', value)}
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
            <p className="text-sm text-muted-foreground">
              How long to keep learning data for AI improvements
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="share-improvement">Share for improvement</Label>
              <p className="text-sm text-muted-foreground">
                Help improve AI for all users (anonymized data only)
              </p>
            </div>
            <Switch
              id="share-improvement"
              checked={settings.shareForImprovement}
              onCheckedChange={(checked) => updateSetting('shareForImprovement', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
            <CardTitle>How It Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
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

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
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