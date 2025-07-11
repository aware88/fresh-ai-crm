'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SettingsForm } from '@/components/settings/settings-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileFormData {
  name: string;
  bio: string;
  avatar_url?: string;
}

export default function ProfileSettings() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const [isUploading, setIsUploading] = useState(false);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase() || 'U';
  };

  const handleSaveProfile = async (formData: ProfileFormData) => {
    const supabase = createClientComponentClient();
    
    // Update user profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user?.id,
        full_name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url || user?.image,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw new Error(error.message);
    
    // Update session to reflect changes immediately
    await updateSession({
      ...session,
      user: {
        ...user,
        name: formData.name
      }
    });
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (file.size > 1024 * 1024) { // 1MB limit
      alert('File size must be less than 1MB');
      return;
    }
    
    try {
      setIsUploading(true);
      const supabase = createClientComponentClient();
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile with new avatar URL
      await handleSaveProfile({
        name: user?.name || '',
        bio: '',
        avatar_url: publicUrl
      });
      
      // Update session
      await updateSession({
        ...session,
        user: {
          ...user,
          image: publicUrl
        }
      });
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const initialData: ProfileFormData = {
    name: user?.name || '',
    bio: '',
    avatar_url: user?.image || undefined
  };

  return (
    <SettingsForm
      title="Profile"
      description="This is how others will see you in the application."
      backUrl="/dashboard"
      onSave={handleSaveProfile}
      initialData={initialData}
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
              <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
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
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name"
                defaultValue={user?.name || ''} 
                onChange={(e) => {
                  const form = e.target.form;
                  if (form) {
                    const formData = new FormData(form);
                    const name = formData.get('name') as string;
                    const bio = formData.get('bio') as string;
                    form.dispatchEvent(new CustomEvent('formdata', {
                      bubbles: true,
                      detail: { name, bio }
                    }));
                  }
                }}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                Your email address is used for login and cannot be changed here.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                placeholder="Tell us a little about yourself"
                onChange={(e) => {
                  const form = e.target.form;
                  if (form) {
                    const formData = new FormData(form);
                    const name = formData.get('name') as string;
                    const bio = formData.get('bio') as string;
                    form.dispatchEvent(new CustomEvent('formdata', {
                      bubbles: true,
                      detail: { name, bio }
                    }));
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsForm>
  );
}
