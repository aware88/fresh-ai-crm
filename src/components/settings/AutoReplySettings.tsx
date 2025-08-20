'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Zap,
  Timer
} from 'lucide-react';

interface AutoReplySettings {
  enabled: boolean;
  delayMinutes: number;
  enabledAgents: string[];
  excludeUrgent: boolean;
  excludeDisputes: boolean;
  requireConfirmation: boolean;
  maxDailyReplies: number;
}

const DELAY_OPTIONS = [
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' }
];

const AGENT_TYPES = [
  { value: 'sales', label: 'Sales Inquiries', color: 'bg-green-100 text-green-800' },
  { value: 'customer', label: 'Customer Support', color: 'bg-blue-100 text-blue-800' },
  { value: 'billing', label: 'Billing Questions', color: 'bg-purple-100 text-purple-800' },
  { value: 'auto_reply', label: 'General Inquiries', color: 'bg-gray-100 text-gray-800' }
];

export default function AutoReplySettings() {
  const [settings, setSettings] = useState<AutoReplySettings>({
    enabled: false,
    delayMinutes: 5, // Default 5 minutes
    enabledAgents: [],
    excludeUrgent: true,
    excludeDisputes: true,
    requireConfirmation: false,
    maxDailyReplies: 50
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingReplies, setPendingReplies] = useState(0);

  useEffect(() => {
    loadSettings();
    loadPendingReplies();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/auto-reply');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load auto-reply settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReplies = async () => {
    try {
      const response = await fetch('/api/auto-reply/pending');
      const data = await response.json();
      
      if (data.success) {
        setPendingReplies(data.count);
      }
    } catch (error) {
      console.error('Failed to load pending replies:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/auto-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Auto-reply settings saved successfully');
      } else {
        console.error('Failed to save settings:', data.error);
      }
    } catch (error) {
      console.error('Failed to save auto-reply settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleAgent = (agentType: string) => {
    setSettings(prev => ({
      ...prev,
      enabledAgents: prev.enabledAgents.includes(agentType)
        ? prev.enabledAgents.filter(a => a !== agentType)
        : [...prev.enabledAgents, agentType]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Timer className="h-5 w-5 animate-spin mr-2" />
            Loading auto-reply settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Auto-Reply Settings
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure automatic email responses with customizable delays
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-reply-enabled" className="text-base font-medium">
                Enable Auto-Reply
              </Label>
              <p className="text-sm text-gray-600">
                Automatically send AI-generated responses after a delay
              </p>
            </div>
            <Switch
              id="auto-reply-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <Separator />

          {/* Delay Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Reply Delay</Label>
            <Select
              value={settings.delayMinutes.toString()}
              onValueChange={(value) => setSettings(prev => ({ ...prev, delayMinutes: parseInt(value) }))}
              disabled={!settings.enabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select delay time" />
              </SelectTrigger>
              <SelectContent>
                {DELAY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              How long to wait before automatically sending the reply
            </p>
          </div>

          <Separator />

          {/* Agent Types */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Enabled for Agent Types</Label>
            <div className="grid grid-cols-2 gap-3">
              {AGENT_TYPES.map(agent => (
                <div
                  key={agent.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.enabledAgents.includes(agent.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => settings.enabled && toggleAgent(agent.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{agent.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.enabledAgents.includes(agent.value) && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                      <Badge className={agent.color}>
                        {agent.value}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Safety Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Safety Settings</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="exclude-urgent">Exclude Urgent Emails</Label>
                  <p className="text-sm text-gray-600">Don't auto-reply to urgent emails</p>
                </div>
                <Switch
                  id="exclude-urgent"
                  checked={settings.excludeUrgent}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, excludeUrgent: checked }))}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="exclude-disputes">Exclude Disputes</Label>
                  <p className="text-sm text-gray-600">Never auto-reply to dispute emails</p>
                </div>
                <Switch
                  id="exclude-disputes"
                  checked={settings.excludeDisputes}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, excludeDisputes: checked }))}
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-confirmation">Require Confirmation</Label>
                  <p className="text-sm text-gray-600">Show pending replies for manual approval</p>
                </div>
                <Switch
                  id="require-confirmation"
                  checked={settings.requireConfirmation}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireConfirmation: checked }))}
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Status and Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Current Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  {settings.enabled ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Auto-reply is enabled</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Auto-reply is disabled</span>
                    </>
                  )}
                </div>
              </div>
              
              {pendingReplies > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Timer className="h-3 w-3 mr-1" />
                  {pendingReplies} pending
                </Badge>
              )}
            </div>

            {settings.enabled && settings.requireConfirmation && pendingReplies > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {pendingReplies} replies waiting for approval.{' '}
                  <Button variant="link" className="p-0 h-auto font-medium">
                    Review pending replies
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={loadSettings} disabled={saving}>
                Reset
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




