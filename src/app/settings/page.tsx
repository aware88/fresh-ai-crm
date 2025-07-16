'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileSettings() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const user = session?.user;
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: '',
    avatar_url: user?.image || undefined
  });

  // Load saved profile data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('user-profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setFormData(prev => ({
          ...prev,
          name: parsed.name || user?.name || '',
          bio: parsed.bio || '',
          avatar_url: parsed.avatar_url || user?.image || undefined
        }));
      } catch (error) {
        console.warn('Failed to parse saved profile data');
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

  const handleSaveProfile = async (formData: any) => {
    try {
      // Save to localStorage first (always works)
      localStorage.setItem('user-profile', JSON.stringify({
        name: formData.name,
        bio: formData.bio,
        avatar_url: formData.avatar_url || user?.image,
        updated_at: new Date().toISOString()
      }));

      // Try to save to Supabase (with error handling)
      if (user?.id) {
        try {
          const supabase = createClientComponentClient();
          
          // Update user profile in Supabase
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: formData.name,
              bio: formData.bio,
              avatar_url: formData.avatar_url || user?.image,
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.warn('Failed to save to database, using localStorage:', error.message);
          }
        } catch (dbError) {
          console.warn('Database save failed, using localStorage:', dbError);
        }
      }
      
      // Update session to reflect changes immediately
      try {
        await updateSession({
          ...session,
          user: {
            ...user,
            name: formData.name,
            image: formData.avatar_url || user?.image
          }
        });
      } catch (sessionError) {
        console.warn('Session update failed:', sessionError);
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (file.size > 1024 * 1024) { // 1MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 1MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a data URL for immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        // Update local form data with data URL for immediate preview
        const updatedFormData = {
          ...formData,
          avatar_url: dataUrl
        };
        setFormData(updatedFormData);
        
        // Dispatch form data event
        document.dispatchEvent(new CustomEvent('formdata', {
          bubbles: true,
          detail: { avatar_url: dataUrl }
        }));
      };
      reader.readAsDataURL(file);
      
      // Try to upload to Supabase storage (with error handling)
      try {
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
        
        // Update local form data with actual URL
        const updatedFormData = {
          ...formData,
          avatar_url: publicUrl
        };
        setFormData(updatedFormData);
        
        // Dispatch form data event
        document.dispatchEvent(new CustomEvent('formdata', {
          bubbles: true,
          detail: { avatar_url: publicUrl }
        }));
        
        // Update session
        try {
          await updateSession({
            ...session,
            user: {
              ...user,
              image: publicUrl
            }
          });
        } catch (sessionError) {
          console.warn('Session update failed:', sessionError);
        }
        
        toast({
          title: "Avatar Updated",
          description: "Your avatar has been updated successfully.",
        });
        
      } catch (storageError: any) {
        console.warn('Storage upload failed, using local preview:', storageError);
        toast({
          title: "Upload Warning",
          description: "Avatar preview updated, but cloud storage failed. Changes saved locally.",
          variant: "default",
        });
      }
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Error uploading avatar: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Dispatch form data event
    document.dispatchEvent(new CustomEvent('formdata', {
      bubbles: true,
      detail: { [field]: value }
    }));
  };

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
          
          <form id="profile-form" className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
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
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </SettingsForm>
  );
}
