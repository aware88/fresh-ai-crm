'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Clock, Target, AlertCircle } from 'lucide-react';
import SyncEmailAnalyticsButton from '@/components/dashboard/CreateSampleDataButton';

interface FollowUpSettings {
  autoFollowupEnabled: boolean;
  defaultFollowupDays: number;
  defaultPriority: 'low' | 'medium' | 'high';
  maxFollowupsPerContact: number;
  excludeReplies: boolean;
  enableNotifications: boolean;
}

export default function EmailFollowupSettings() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [settings, setSettings] = useState<FollowUpSettings>({
    autoFollowupEnabled: true,
    defaultFollowupDays: 3,
    defaultPriority: 'medium',
    maxFollowupsPerContact: 3,
    excludeReplies: true,
    enableNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/email-followups');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings || settings);
        }
      } catch (error) {
        console.error('Error loading follow-up settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      loadSettings();
    }
  }, [session?.user?.id]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/email-followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Your email follow-up settings have been updated.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Follow-up Settings</h1>
        <p className="text-muted-foreground">
          Configure automatic follow-up tracking and analytics for your emails
        </p>
      </div>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Email Analytics Sync
          </CardTitle>
          <CardDescription>
            Sync your existing emails to create follow-up tracking and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This will analyze your sent emails and create follow-up tracking for outbound messages. 
                  It will also match any responses to existing follow-ups.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Only processes emails since your last sync to avoid duplicates.
                </p>
              </div>
            </div>
            
            <Separator />
            
            <SyncEmailAnalyticsButton 
              organizationId={session?.user?.organizationId}
              onDataCreated={() => {
                toast({
                  title: 'Sync Complete',
                  description: 'Email analytics have been updated.',
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Follow-up Configuration
          </CardTitle>
          <CardDescription>
            Configure how automatic follow-ups are created for new emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-followup">Enable Automatic Follow-ups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create follow-up tracking for outbound emails
              </p>
            </div>
            <Switch
              id="auto-followup"
              checked={settings.autoFollowupEnabled}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, autoFollowupEnabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="followup-days">Default Follow-up Days</Label>
              <Select
                value={settings.defaultFollowupDays.toString()}
                onValueChange={(value) =>
                  setSettings(prev => ({ ...prev, defaultFollowupDays: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How many days to wait before a follow-up is due
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-priority">Default Priority</Label>
              <Select
                value={settings.defaultPriority}
                onValueChange={(value: 'low' | 'medium' | 'high') =>
                  setSettings(prev => ({ ...prev, defaultPriority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default priority level for new follow-ups
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="exclude-replies">Exclude Reply Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Don't create follow-ups for emails that start with "Re:"
                </p>
              </div>
              <Switch
                id="exclude-replies"
                checked={settings.excludeReplies}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, excludeReplies: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-notifications">Follow-up Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when follow-ups are due or overdue
                </p>
              </div>
              <Switch
                id="enable-notifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, enableNotifications: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Follow-up Analytics
          </CardTitle>
          <CardDescription>
            View your email follow-up performance and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              After syncing your emails, detailed analytics will appear here showing:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
              <li>• Response rates and timing</li>
              <li>• Follow-up effectiveness</li>
              <li>• Overdue follow-ups</li>
              <li>• Conversion metrics</li>
            </ul>
            <Button variant="outline" className="mt-4" asChild>
              <a href="/dashboard/analytics">
                View Full Analytics Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






