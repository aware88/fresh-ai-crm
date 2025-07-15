'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { SettingsForm } from '@/components/settings/settings-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';

interface AccountSettings {
  twoFactorEnabled: boolean;
  activityEmails: boolean;
  marketingEmails: boolean;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const user = session?.user;
  const [settings, setSettings] = React.useState<AccountSettings>({
    twoFactorEnabled: false,
    activityEmails: true,
    marketingEmails: false
  });
  
  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('aris-account-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.warn('Failed to parse saved account settings');
      }
    }
  }, []);
  
  const handleSaveSettings = async (formData: AccountSettings) => {
    try {
      // Save to localStorage immediately (always works)
      localStorage.setItem('aris-account-settings', JSON.stringify(formData));
      setSettings(formData);
      
      // Try to save to Supabase (with error handling)
      if (user?.id) {
        const supabase = createClientComponentClient();
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            two_factor_enabled: formData.twoFactorEnabled,
            activity_emails: formData.activityEmails,
            marketing_emails: formData.marketingEmails,
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
  
  const handleDeleteAccount = () => {
    toast({
      title: "Are you sure?",
      description: "This action cannot be undone. Please contact support if you really want to delete your account.",
      variant: "destructive",
    });
  };
  
  return (
    <SettingsForm
      title="Account"
      description="Manage your account settings and preferences."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={settings}
    >
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Update your account security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor">Two-factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Switch 
              id="two-factor" 
              onCheckedChange={(checked) => {
                const form = document.getElementById('account-form') as HTMLFormElement;
                if (form) {
                  form.dispatchEvent(new CustomEvent('formdata', {
                    bubbles: true,
                    detail: { twoFactorEnabled: checked }
                  }));
                }
              }}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="activity-emails">Activity Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about your account activity.
              </p>
            </div>
            <Switch 
              id="activity-emails" 
              defaultChecked 
              onCheckedChange={(checked) => {
                const form = document.getElementById('account-form') as HTMLFormElement;
                if (form) {
                  form.dispatchEvent(new CustomEvent('formdata', {
                    bubbles: true,
                    detail: { activityEmails: checked }
                  }));
                }
              }}
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new features and offers.
              </p>
            </div>
            <Switch 
              id="marketing-emails" 
              onCheckedChange={(checked) => {
                const form = document.getElementById('account-form') as HTMLFormElement;
                if (form) {
                  form.dispatchEvent(new CustomEvent('formdata', {
                    bubbles: true,
                    detail: { marketingEmails: checked }
                  }));
                }
              }}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Change Password</h4>
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <form id="account-form" className="hidden"></form>
    </SettingsForm>
  );
}
