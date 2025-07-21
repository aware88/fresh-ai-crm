'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { redirect } from 'next/navigation';
import { LogoUploader } from '@/components/settings/LogoUploader';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';

export default function BrandingPage() {
  const { data: session, status } = useOptimizedAuth();
  const { toast } = useToast();
  const [brandingSettings, setBrandingSettings] = useState({
    companyName: '',
    logoUrl: ''
  });

  useEffect(() => {
    // Load saved branding settings
    const companyName = localStorage.getItem('companyName') || '';
    const logoUrl = localStorage.getItem('companyLogo') || '';
    setBrandingSettings({ companyName, logoUrl });
  }, []);

  const handleSaveSettings = async (formData: any) => {
    try {
      // In a real app, you would save these settings to the server
      // For now, we'll just update our local state
      setBrandingSettings(formData);
      
      // The actual saving is handled by the LogoUploader component
      
      toast({
        title: "Settings Saved",
        description: "Your branding settings have been updated.",
      });
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings. Please try again.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' && !session) {
    redirect('/signin');
  }

  return (
    <SettingsForm
      title="Company Branding"
      description="Upload your company logo and set your company name to customize the navigation bar."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={brandingSettings}
    >
      <LogoUploader />
    </SettingsForm>
  );
} 