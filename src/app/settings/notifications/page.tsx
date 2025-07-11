'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SettingsForm } from '@/components/settings/settings-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';

interface NotificationSettings {
  newEmails: boolean;
  contactUpdates: boolean;
  taskReminders: boolean;
  marketingUpdates: boolean;
  emailProcessed: boolean;
  newContacts: boolean;
  taskDue: boolean;
}

export default function NotificationSettings() {
  const { data: session } = useSession();
  const user = session?.user;
  const [settings, setSettings] = useState<NotificationSettings>({
    newEmails: true,
    contactUpdates: true,
    taskReminders: true,
    marketingUpdates: false,
    emailProcessed: true,
    newContacts: true,
    taskDue: true
  });
  
  const handleSaveSettings = async (formData: NotificationSettings) => {
    const supabase = createClientComponentClient();
    
    // Save notification settings to Supabase
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user?.id,
        new_emails: formData.newEmails,
        contact_updates: formData.contactUpdates,
        task_reminders: formData.taskReminders,
        marketing_updates: formData.marketingUpdates,
        email_processed: formData.emailProcessed,
        new_contacts: formData.newContacts,
        task_due: formData.taskDue,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw new Error(error.message);
  };
  
  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    const form = document.getElementById('notifications-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new CustomEvent('formdata', {
        bubbles: true,
        detail: { [key]: value }
      }));
    }
  };

  return (
    <SettingsForm
      title="Notifications"
      description="Configure how you want to be notified about activities."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={settings}
    >
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Manage which email notifications you receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="new-emails">New Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when new emails arrive.
              </p>
            </div>
            <Switch 
              id="new-emails" 
              defaultChecked={settings.newEmails}
              onCheckedChange={(checked) => updateSetting('newEmails', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="contact-updates">Contact Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when contacts are updated.
              </p>
            </div>
            <Switch 
              id="contact-updates" 
              defaultChecked={settings.contactUpdates}
              onCheckedChange={(checked) => updateSetting('contactUpdates', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="task-reminders">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders about upcoming tasks.
              </p>
            </div>
            <Switch 
              id="task-reminders" 
              defaultChecked={settings.taskReminders}
              onCheckedChange={(checked) => updateSetting('taskReminders', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-updates">Marketing Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features and improvements.
              </p>
            </div>
            <Switch 
              id="marketing-updates" 
              defaultChecked={settings.marketingUpdates}
              onCheckedChange={(checked) => updateSetting('marketingUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Manage which notifications appear within the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="email-processed">Email Processing</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications when emails are processed by AI.
              </p>
            </div>
            <Switch 
              id="email-processed" 
              defaultChecked={settings.emailProcessed}
              onCheckedChange={(checked) => updateSetting('emailProcessed', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="new-contacts">New Contacts</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications when new contacts are added.
              </p>
            </div>
            <Switch 
              id="new-contacts" 
              defaultChecked={settings.newContacts}
              onCheckedChange={(checked) => updateSetting('newContacts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="task-due">Task Due</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications when tasks are due.
              </p>
            </div>
            <Switch 
              id="task-due" 
              defaultChecked={settings.taskDue}
              onCheckedChange={(checked) => updateSetting('taskDue', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <form id="notifications-form" className="hidden"></form>
    </SettingsForm>
  );
}
