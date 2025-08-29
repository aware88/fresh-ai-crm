'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SettingsForm } from '@/components/settings/settings-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';

interface DisplaySettings {
  emailSort: string;
  emailPreviewLength: number;
  emailView: string;
  dashboardLayout: string;
  showOpportunityBadges: boolean;
  enableSmartSorting: boolean;
  widgets: {
    emails: boolean;
    contacts: boolean;
    tasks: boolean;
    analytics: boolean;
  };
}

export default function DisplaySettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [emailPreviewLength, setEmailPreviewLength] = useState(2);
  const [settings, setSettings] = useState<DisplaySettings>({
    emailSort: 'newest',
    emailPreviewLength: 2,
    emailView: 'threaded',
    dashboardLayout: 'grid',
    showOpportunityBadges: true,
    enableSmartSorting: true,
    widgets: {
      emails: true,
      contacts: true,
      tasks: true,
      analytics: true
    }
  });
  
  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('aris-display-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setEmailPreviewLength(parsed.emailPreviewLength || 2);
      } catch (error) {
        console.warn('Failed to parse saved display settings');
      }
    }
  }, []);

  const handleSaveSettings = async (formData: DisplaySettings) => {
    try {
      // Save to localStorage immediately (always works)
      localStorage.setItem('aris-display-settings', JSON.stringify(formData));
      
      // Update local state
      setSettings(formData);
      
      // Try to save to Supabase (with error handling)
      if (user?.id) {
        const supabase = createClientComponentClient();
        const { error } = await supabase
          .from('display_preferences')
          .upsert({
            user_id: user.id,
            email_sort: formData.emailSort,
            email_preview_length: formData.emailPreviewLength,
            email_view: formData.emailView,
            dashboard_layout: formData.dashboardLayout,
            show_opportunity_badges: formData.showOpportunityBadges,
            enable_smart_sorting: formData.enableSmartSorting,
            widget_emails: formData.widgets.emails,
            widget_contacts: formData.widgets.contacts,
            widget_tasks: formData.widgets.tasks,
            widget_analytics: formData.widgets.analytics,
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.warn('Failed to save to database, using localStorage:', error.message);
        }
      }
    } catch (error) {
      console.warn('Settings saved locally only:', error);
    }
  };
  
  const updateSettings = (key: string, value: any) => {
    if (key.includes('.')) {
      // Handle nested properties like 'widgets.emails'
      const [parent, child] = key.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof DisplaySettings] as object),
          [child]: value
        }
      }));
    } else {
      // Handle top-level properties
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    
    const form = document.getElementById('display-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new CustomEvent('formdata', {
        bubbles: true,
        detail: { [key]: value }
      }));
    }
  };

  return (
    <SettingsForm
      title="Display"
      description="Customize how information is displayed in the application."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={settings}
    >
      <Card>
        <CardHeader>
          <CardTitle>Email Display</CardTitle>
          <CardDescription>
            Configure how emails are displayed in the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email-sort">Default Sort Order</Label>
            <Select 
              defaultValue={settings.emailSort}
              onValueChange={(value) => updateSettings('emailSort', value)}
            >
              <SelectTrigger id="email-sort">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="unread">Unread First</SelectItem>
                <SelectItem value="importance">By Importance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Email Preview Length</Label>
            <div className="flex items-center space-x-2">
              <Slider 
                defaultValue={[settings.emailPreviewLength]} 
                max={5} 
                step={1} 
                onValueChange={(value) => {
                  setEmailPreviewLength(value[0]);
                  updateSettings('emailPreviewLength', value[0]);
                }}
              />
              <span className="w-12 text-center text-sm">{emailPreviewLength} lines</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Email View</Label>
            <RadioGroup 
              defaultValue={settings.emailView} 
              className="flex space-x-4"
              onValueChange={(value) => updateSettings('emailView', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="threaded" id="threaded" />
                <Label htmlFor="threaded">Threaded</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id="flat" />
                <Label htmlFor="flat">Flat</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="opportunity-badges">Show Opportunity Badges</Label>
                <p className="text-sm text-muted-foreground">
                  Display sales opportunity indicators on email tiles
                </p>
              </div>
              <Checkbox
                id="opportunity-badges"
                checked={settings.showOpportunityBadges}
                onCheckedChange={(checked) => updateSettings('showOpportunityBadges', !!checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smart-sorting">Enable Smart Email Sorting</Label>
                <p className="text-sm text-muted-foreground">
                  Sort emails by priority (highlighted first), then by date. When off, all emails sorted by date only.
                </p>
              </div>
              <Checkbox
                id="smart-sorting"
                checked={settings.enableSmartSorting}
                onCheckedChange={(checked) => updateSettings('enableSmartSorting', !!checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Layout</CardTitle>
          <CardDescription>
            Configure how the dashboard is displayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="dashboard-layout">Default Layout</Label>
            <Select 
              defaultValue={settings.dashboardLayout}
              onValueChange={(value) => updateSettings('dashboardLayout', value)}
            >
              <SelectTrigger id="dashboard-layout">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Dashboard Widgets</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="widget-emails" 
                  defaultChecked={settings.widgets.emails}
                  onCheckedChange={(checked) => updateSettings('widgets.emails', !!checked)}
                />
                <Label htmlFor="widget-emails">Recent Emails</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="widget-contacts" 
                  defaultChecked={settings.widgets.contacts}
                  onCheckedChange={(checked) => updateSettings('widgets.contacts', !!checked)}
                />
                <Label htmlFor="widget-contacts">Contacts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="widget-tasks" 
                  defaultChecked={settings.widgets.tasks}
                  onCheckedChange={(checked) => updateSettings('widgets.tasks', !!checked)}
                />
                <Label htmlFor="widget-tasks">Tasks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="widget-analytics" 
                  defaultChecked={settings.widgets.analytics}
                  onCheckedChange={(checked) => updateSettings('widgets.analytics', !!checked)}
                />
                <Label htmlFor="widget-analytics">Analytics</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <form id="display-form" className="hidden"></form>
    </SettingsForm>
  );
}
