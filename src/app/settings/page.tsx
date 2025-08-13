'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function ProfileSettings() {
  const { data: session, update: updateSession, status, isLoading } = useOptimizedAuth();
  const { toast } = useToast();
  const router = useRouter();
  const user = session?.user;


  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    company: ''
  });

  // Load saved profile data from localStorage on mount and initialize with session data
  useEffect(() => {
    if (user) {
      // First set the default values from session
      // If user.name is empty, try to get it from localStorage or use email prefix
      let userName = user.name;
      if (!userName) {
        const savedProfile = localStorage.getItem('user-profile');
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            userName = parsed.name;
          } catch (e) {
            // Ignore parsing errors
          }
        }
        // Final fallback to email prefix
        if (!userName) {
          userName = user.email?.split('@')[0] || '';
        }
      }

      const defaultFormData = {
        name: userName,
        bio: '',
        company: ''
      };

      // Then check for saved profile data
      const savedProfile = localStorage.getItem('user-profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setFormData({
            name: parsed.name || userName,
            bio: parsed.bio || '',
            company: parsed.company || ''
          });
        } catch (error) {
          console.warn('Failed to parse saved profile data');
          setFormData(defaultFormData);
        }
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [user]);

  // Load user identity data
  useEffect(() => {
    const loadUserIdentity = async () => {
      try {
        const response = await fetch('/api/user-identity');
        if (response.ok) {
          const data = await response.json();
          if (data.identity) {
            setFormData(prev => ({
              ...prev,
              company: data.identity.company || prev.company,
              name: data.identity.name || prev.name
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user identity:', error);
      }
    };

    if (user) {
      loadUserIdentity();
    }
  }, [user]);


  


  const handleSaveProfile = async (data: any) => {
    try {
      // Save profile data to localStorage (always works)
      const profileData = {
        name: data.name,
        bio: data.bio,
        company: data.company
      };
      
      localStorage.setItem('user-profile', JSON.stringify(profileData));
      
      // Try to save to Supabase if available
      if (user?.id) {
        try {
          const supabase = createClientComponentClient();
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              name: data.name,
              bio: data.bio,
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.warn('Failed to save to database, using localStorage:', error.message);
          }
        } catch (dbError) {
          console.warn('Database save failed, using localStorage:', dbError);
        }
      }
      
      // Update the session with the new name
      if (data.name !== user?.name) {
        try {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              name: data.name
            }
          });
        } catch (sessionError) {
          console.warn('Session update failed:', sessionError);
        }
      }
      
      // Update local form data
      setFormData(profileData);

      // Also save to user identity API if company or name changed
      if (profileData.company || profileData.name) {
        try {
          await fetch('/api/user-identity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              identity: {
                name: profileData.name,
                company: profileData.company,
                email: user?.email || ''
              }
            }),
          });
        } catch (identityError) {
          console.error('Error saving user identity:', identityError);
          // Don't throw here as profile was saved successfully
        }
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSignIn = () => {
    router.push('/signin');
  };

  // Show loading state while session is being fetched OR during initial load
  // This prevents the authentication flash by ensuring we wait for the session to be fully loaded
  if (status === 'loading' || isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Only show auth required if we're DEFINITELY unauthenticated (session is null AND not loading)
  // This should rarely trigger since we're being very conservative above
  if (status === 'unauthenticated' && !isLoading && !session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to be signed in to access your profile settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Please sign in to view and manage your profile settings.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleSignIn}>
              Sign In
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Final safety check - if no user object, show loading
  if (!session.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsForm
      title="Profile"
      description="Manage your personal information and identity details for AI email analysis."
      onSave={handleSaveProfile}
      initialData={formData}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Manage your personal information and how it appears to others.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  const newData = { ...formData, name: e.target.value };
                  setFormData(newData);
                  // Emit custom formdata event for SettingsForm
                  document.dispatchEvent(new CustomEvent('formdata', { detail: newData }));
                }}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => {
                  const newData = { ...formData, bio: e.target.value };
                  setFormData(newData);
                  // Emit custom formdata event for SettingsForm
                  document.dispatchEvent(new CustomEvent('formdata', { detail: newData }));
                }}
                placeholder="Tell us a little about yourself"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={(e) => {
                  const newData = { ...formData, company: e.target.value };
                  setFormData(newData);
                  // Emit custom formdata event for SettingsForm
                  document.dispatchEvent(new CustomEvent('formdata', { detail: newData }));
                }}
                placeholder="e.g., Bulk Nutrition"
              />
              <p className="text-xs text-muted-foreground">
                This helps the AI identify your business context in email conversations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your email address cannot be changed here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsForm>
  );
}
