'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { 
  Timer, 
  Mail, 
  Bot, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Settings as SettingsIcon,
  Zap
} from 'lucide-react';

interface FollowUpSettings {
  enabled: boolean;
  automaticFollowup: boolean;
  followupDelay: number;
  maxFollowups: number;
  followupPriority: 'low' | 'medium' | 'high';
  aiGeneration: boolean;
  customTemplates: boolean;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  excludeWeekends: boolean;
  autoSnooze: {
    enabled: boolean;
    duration: number;
  };
}

export default function FollowUpSettingsPage() {
  const { data: session, status } = useOptimizedAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<FollowUpSettings>({
    enabled: true,
    automaticFollowup: false,
    followupDelay: 24,
    maxFollowups: 3,
    followupPriority: 'medium',
    aiGeneration: true,
    customTemplates: false,
    workingHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      timezone: 'UTC'
    },
    excludeWeekends: true,
    autoSnooze: {
      enabled: false,
      duration: 7
    }
  });

  useEffect(() => {
    // Load settings from localStorage or API
    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('followup-settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load follow-up settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadSettings();
    }
  }, [status]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage (and potentially API)
      localStorage.setItem('followup-settings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Your follow-up settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save follow-up settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof FollowUpSettings] as any,
        [key]: value
      }
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to access follow-up settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Follow-up Settings</h2>
          <p className="text-gray-600 mt-1">Configure automatic email follow-ups and AI-powered responses</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Bot className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="timing" className="gap-2">
            <Clock className="h-4 w-4" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Zap className="h-4 w-4" />
            AI Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Follow-up Configuration
              </CardTitle>
              <CardDescription>
                Basic settings for email follow-up management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Follow-ups</Label>
                  <p className="text-sm text-gray-500">
                    Turn on automatic follow-up tracking and management
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Follow-up Delay (hours)</Label>
                  <Input
                    type="number"
                    value={settings.followupDelay}
                    onChange={(e) => updateSetting('followupDelay', parseInt(e.target.value))}
                    min="1"
                    max="168"
                  />
                  <p className="text-xs text-gray-500">Time to wait before suggesting a follow-up</p>
                </div>

                <div className="space-y-2">
                  <Label>Maximum Follow-ups</Label>
                  <Input
                    type="number"
                    value={settings.maxFollowups}
                    onChange={(e) => updateSetting('maxFollowups', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500">Maximum number of follow-ups per conversation</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Follow-up Priority</Label>
                <Select
                  value={settings.followupPriority}
                  onValueChange={(value) => updateSetting('followupPriority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Low</Badge>
                        <span>Standard priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Medium</Badge>
                        <span>Important follow-ups</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">High</Badge>
                        <span>Urgent follow-ups</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>
                Configure automatic follow-up behaviors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Automatic Follow-ups</Label>
                  <p className="text-sm text-gray-500">
                    Automatically create follow-up tasks for unanswered emails
                  </p>
                </div>
                <Switch
                  checked={settings.automaticFollowup}
                  onCheckedChange={(checked) => updateSetting('automaticFollowup', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-snooze</Label>
                  <p className="text-sm text-gray-500">
                    Automatically snooze follow-ups when replied to
                  </p>
                </div>
                <Switch
                  checked={settings.autoSnooze.enabled}
                  onCheckedChange={(checked) => updateNestedSetting('autoSnooze', 'enabled', checked)}
                />
              </div>

              {settings.autoSnooze.enabled && (
                <div className="space-y-2 pl-6 border-l-2 border-blue-100">
                  <Label>Auto-snooze Duration (days)</Label>
                  <Input
                    type="number"
                    value={settings.autoSnooze.duration}
                    onChange={(e) => updateNestedSetting('autoSnooze', 'duration', parseInt(e.target.value))}
                    min="1"
                    max="30"
                  />
                  <p className="text-xs text-gray-500">How long to snooze after receiving a reply</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timing & Schedule
              </CardTitle>
              <CardDescription>
                Control when follow-ups are created and sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Working Hours Only</Label>
                  <p className="text-sm text-gray-500">
                    Only create follow-ups during business hours
                  </p>
                </div>
                <Switch
                  checked={settings.workingHours.enabled}
                  onCheckedChange={(checked) => updateNestedSetting('workingHours', 'enabled', checked)}
                />
              </div>

              {settings.workingHours.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={settings.workingHours.start}
                        onChange={(e) => updateNestedSetting('workingHours', 'start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={settings.workingHours.end}
                        onChange={(e) => updateNestedSetting('workingHours', 'end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Exclude Weekends</Label>
                  <p className="text-sm text-gray-500">
                    Don't create follow-ups on Saturday and Sunday
                  </p>
                </div>
                <Switch
                  checked={settings.excludeWeekends}
                  onCheckedChange={(checked) => updateSetting('excludeWeekends', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI-Powered Features
              </CardTitle>
              <CardDescription>
                Enable AI assistance for follow-up management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">AI Draft Generation</Label>
                  <p className="text-sm text-gray-500">
                    Use AI to generate follow-up email drafts automatically
                  </p>
                </div>
                <Switch
                  checked={settings.aiGeneration}
                  onCheckedChange={(checked) => updateSetting('aiGeneration', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Custom Templates</Label>
                  <p className="text-sm text-gray-500">
                    Use personalized templates based on your writing style
                  </p>
                </div>
                <Switch
                  checked={settings.customTemplates}
                  onCheckedChange={(checked) => updateSetting('customTemplates', checked)}
                />
              </div>

              {settings.aiGeneration && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">AI Features Enabled</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        AI will analyze your email patterns and generate contextually appropriate follow-up drafts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


