'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function ProfileSettings() {
  const { data: session, update: updateSession, status, isLoading } = useOptimizedAuth();
  const { toast } = useToast();
  const router = useRouter();
  const user = session?.user;
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: undefined as string | undefined
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
        avatar_url: user.image || undefined
      };

      // Then check for saved profile data
      const savedProfile = localStorage.getItem('user-profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setFormData({
            name: parsed.name || userName,
            bio: parsed.bio || '',
            avatar_url: parsed.avatar_url || user.image || undefined
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


  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase() || 'U';
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose a file smaller than 1MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload to a simple file upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      // Update the form data with the new avatar URL
      setFormData(prev => ({
        ...prev,
        avatar_url: data.url
      }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload your avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (data: any) => {
    try {
      // Save profile data to localStorage (always works)
      const profileData = {
        name: data.name,
        bio: data.bio,
        avatar_url: data.avatar_url
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
              avatar_url: data.avatar_url,
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
              name: data.name,
              image: data.avatar_url
            }
          });
        } catch (sessionError) {
          console.warn('Session update failed:', sessionError);
        }
      }
      
      // Update local form data
      setFormData(profileData);
      
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
      description="This is how others will see you in the application."
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
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url || user?.image || ''} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xl">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <label htmlFor="avatar-upload">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-2"
                  disabled={isUploading}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {isUploading ? 'Uploading...' : 'Change Avatar'}
                </Button>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us a little about yourself"
              />
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
