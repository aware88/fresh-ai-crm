'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/components/ui/use-toast';
import { SettingsForm } from '@/components/settings/settings-form';
import { TwoFactorAuthSetup } from '@/components/settings/TwoFactorAuthSetup';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';
import { ShieldCheck, KeyRound, History, User } from "lucide-react";
import { format } from 'date-fns';

interface AccountSettings {
  twoFactorEnabled: boolean;
  activityEmails: boolean;
  marketingEmails: boolean;
}

interface AuthAttempt {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_successful: boolean;
  created_at: string;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [recentAttempts, setRecentAttempts] = useState<AuthAttempt[]>([]);
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

  // Fetch security data when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchRecentAttempts();
    }
  }, [status, session]);
  
  const fetchRecentAttempts = async () => {
    try {
      const response = await fetch('/api/user/two-factor-auth/status');
      const data = await response.json();
      
      if (data.recentAttempts) {
        setRecentAttempts(data.recentAttempts);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent attempts:', error);
      setLoading(false);
    }
  };
  
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
  
  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="space-y-6">
        <p>Please sign in to access your account settings.</p>
      </div>
    );
  }

  return (
    <SettingsForm
      title="Account & Security"
      description="Manage your account settings, security preferences, and monitor activity."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={settings}
    >
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account Settings
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Update your account preferences and notification settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          {session?.user && (
            <TwoFactorAuthSetup 
              userId={session.user.id} 
              userEmail={session.user.email || ''} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Authentication Activity
              </CardTitle>
              <CardDescription>
                Review recent login attempts and two-factor authentication verifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentAttempts.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 pl-4">Date & Time</th>
                        <th className="text-left p-2">IP Address</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b last:border-0">
                          <td className="p-2 pl-4">
                            {format(new Date(attempt.created_at), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="p-2">
                            {attempt.ip_address || 'Unknown'}
                          </td>
                          <td className="p-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${attempt.is_successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {attempt.is_successful ? 'Success' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No recent authentication activity found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <form id="account-form" className="hidden"></form>
    </SettingsForm>
  );
}
