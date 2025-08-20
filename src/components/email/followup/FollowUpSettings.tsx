'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Zap, 
  Brain, 
  Users, 
  Bell,
  Clock,
  Target,
  DollarSign,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FollowUpSettingsProps {
  className?: string;
}

export default function FollowUpSettings({ className }: FollowUpSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General settings
    defaultFollowUpDays: 3,
    enableAutoFollowUp: true,
    maxFollowUpAttempts: 3,
    businessHoursOnly: true,
    excludeWeekends: true,
    
    // AI settings
    aiDraftGeneration: true,
    aiConfidenceThreshold: 0.8,
    preferredTone: 'professional',
    preferredApproach: 'gentle',
    customInstructions: '',
    
    // Automation settings
    automationEnabled: true,
    autoSendThreshold: 0.9,
    requireApproval: true,
    approvalTimeout: 24,
    
    // Notification settings
    emailNotifications: true,
    browserNotifications: true,
    overdueAlerts: true,
    dailyDigest: true,
    
    // Team settings
    enableAssignment: true,
    workloadBalancing: true,
    skillBasedRouting: false,
    escalationEnabled: true
  });

  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In production, this would save to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      defaultFollowUpDays: 3,
      enableAutoFollowUp: true,
      maxFollowUpAttempts: 3,
      businessHoursOnly: true,
      excludeWeekends: true,
      aiDraftGeneration: true,
      aiConfidenceThreshold: 0.8,
      preferredTone: 'professional',
      preferredApproach: 'gentle',
      customInstructions: '',
      automationEnabled: true,
      autoSendThreshold: 0.9,
      requireApproval: true,
      approvalTimeout: 24,
      emailNotifications: true,
      browserNotifications: true,
      overdueAlerts: true,
      dailyDigest: true,
      enableAssignment: true,
      workloadBalancing: true,
      skillBasedRouting: false,
      escalationEnabled: true
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Follow-up Settings
          </h2>
          <p className="text-gray-600">Configure automation, AI, and team preferences</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI & ML
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Default Follow-up Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultDays">Default Follow-up Days</Label>
                    <Input
                      id="defaultDays"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.defaultFollowUpDays}
                      onChange={(e) => handleSettingChange('defaultFollowUpDays', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAttempts">Max Follow-up Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxFollowUpAttempts}
                      onChange={(e) => handleSettingChange('maxFollowUpAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAuto">Enable Auto Follow-up Creation</Label>
                    <Switch
                      id="enableAuto"
                      checked={settings.enableAutoFollowUp}
                      onCheckedChange={(checked) => handleSettingChange('enableAutoFollowUp', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="businessHours">Business Hours Only</Label>
                    <Switch
                      id="businessHours"
                      checked={settings.businessHoursOnly}
                      onCheckedChange={(checked) => handleSettingChange('businessHoursOnly', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="excludeWeekends">Exclude Weekends</Label>
                    <Switch
                      id="excludeWeekends"
                      checked={settings.excludeWeekends}
                      onCheckedChange={(checked) => handleSettingChange('excludeWeekends', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Draft Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="aiDrafts">Enable AI Draft Generation</Label>
                  <Switch
                    id="aiDrafts"
                    checked={settings.aiDraftGeneration}
                    onCheckedChange={(checked) => handleSettingChange('aiDraftGeneration', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confidenceThreshold">AI Confidence Threshold</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="confidenceThreshold"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={settings.aiConfidenceThreshold}
                      onChange={(e) => handleSettingChange('aiConfidenceThreshold', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {(settings.aiConfidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredTone">Preferred Tone</Label>
                    <Select
                      value={settings.preferredTone}
                      onValueChange={(value) => handleSettingChange('preferredTone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="preferredApproach">Preferred Approach</Label>
                    <Select
                      value={settings.preferredApproach}
                      onValueChange={(value) => handleSettingChange('preferredApproach', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gentle">Gentle</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="value-add">Value-add</SelectItem>
                        <SelectItem value="alternative">Alternative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customInstructions">Custom AI Instructions</Label>
                  <Textarea
                    id="customInstructions"
                    placeholder="Add specific instructions for AI draft generation..."
                    value={settings.customInstructions}
                    onChange={(e) => handleSettingChange('customInstructions', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Automation Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="automationEnabled">Enable Automation</Label>
                  <Switch
                    id="automationEnabled"
                    checked={settings.automationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('automationEnabled', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="autoSendThreshold">Auto-Send Threshold</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="autoSendThreshold"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={settings.autoSendThreshold}
                      onChange={(e) => handleSettingChange('autoSendThreshold', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {(settings.autoSendThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only auto-send when AI confidence is above this threshold
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireApproval">Require Approval for Auto-Send</Label>
                  <Switch
                    id="requireApproval"
                    checked={settings.requireApproval}
                    onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="approvalTimeout">Approval Timeout (hours)</Label>
                  <Input
                    id="approvalTimeout"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.approvalTimeout}
                    onChange={(e) => handleSettingChange('approvalTimeout', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="browserNotifications">Browser Notifications</Label>
                    <Switch
                      id="browserNotifications"
                      checked={settings.browserNotifications}
                      onCheckedChange={(checked) => handleSettingChange('browserNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="overdueAlerts">Overdue Alerts</Label>
                    <Switch
                      id="overdueAlerts"
                      checked={settings.overdueAlerts}
                      onCheckedChange={(checked) => handleSettingChange('overdueAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dailyDigest">Daily Digest</Label>
                    <Switch
                      id="dailyDigest"
                      checked={settings.dailyDigest}
                      onCheckedChange={(checked) => handleSettingChange('dailyDigest', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Team Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAssignment">Enable Assignment</Label>
                    <Switch
                      id="enableAssignment"
                      checked={settings.enableAssignment}
                      onCheckedChange={(checked) => handleSettingChange('enableAssignment', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="workloadBalancing">Workload Balancing</Label>
                    <Switch
                      id="workloadBalancing"
                      checked={settings.workloadBalancing}
                      onCheckedChange={(checked) => handleSettingChange('workloadBalancing', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="skillBasedRouting">Skill-Based Routing</Label>
                    <Switch
                      id="skillBasedRouting"
                      checked={settings.skillBasedRouting}
                      onCheckedChange={(checked) => handleSettingChange('skillBasedRouting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="escalationEnabled">Enable Escalation</Label>
                    <Switch
                      id="escalationEnabled"
                      checked={settings.escalationEnabled}
                      onCheckedChange={(checked) => handleSettingChange('escalationEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Cost Savings Display */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Estimated Monthly Savings
              </h3>
              <p className="text-sm text-gray-600">Based on current settings</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">$4,250</p>
              <p className="text-sm text-gray-500">per month</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-gray-900">Time Saved</p>
              <p className="text-green-600">85 hours/month</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">Response Rate</p>
              <p className="text-green-600">+25% improvement</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">Automation Rate</p>
              <p className="text-green-600">
                {settings.automationEnabled ? '95%' : '0%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



