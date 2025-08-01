'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

import { LogoUploader } from '@/components/settings/LogoUploader';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';

export default function BrandingPage() {
  const { data: session, status, isLoading } = useOptimizedAuth();
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !session && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access branding settings.</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => window.location.href = '/signin'} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
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