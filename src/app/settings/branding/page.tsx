'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSimpleOrganizationAdmin } from '@/hooks/useSimpleOrganizationAdmin';

import { LogoUploader } from '@/components/settings/LogoUploader';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BrandingPage() {
  const { data: session, status, isLoading } = useOptimizedAuth();
  const { organization } = useOrganization();
  const { isAdmin, loading: adminLoading, error: adminError } = useSimpleOrganizationAdmin();
  const { toast } = useToast();
  const [brandingSettings, setBrandingSettings] = useState({
    companyName: '',
    logoUrl: '',
    primaryColor: '#0f172a',
    secondaryColor: '#64748b',
    accentColor: '#2563eb'
  });
  const [loading, setLoading] = useState(false);
  const [adminTimeout, setAdminTimeout] = useState(false);

  // Add timeout for admin loading to prevent infinite loading
  useEffect(() => {
    if (adminLoading) {
      const timer = setTimeout(() => {
        setAdminTimeout(true);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setAdminTimeout(false);
    }
  }, [adminLoading]);

  useEffect(() => {
    // Load saved branding settings and fetch organization branding
    const companyName = localStorage.getItem('companyName') || '';
    const logoUrl = localStorage.getItem('companyLogo') || '';
    
    setBrandingSettings(prev => ({
      ...prev,
      companyName,
      logoUrl
    }));

    // Fetch organization branding settings
    if (organization?.id) {
      fetchBrandingSettings(organization.id);
    }
  }, [organization]);

  // Force form to recognize changes when branding settings are loaded
  useEffect(() => {
    if (brandingSettings.primaryColor && brandingSettings.secondaryColor && brandingSettings.accentColor) {
      // Dispatch initial formdata to ensure SettingsForm recognizes the current state
      document.dispatchEvent(new CustomEvent('formdata', {
        bubbles: true,
        detail: brandingSettings
      }));
    }
  }, [brandingSettings.primaryColor, brandingSettings.secondaryColor, brandingSettings.accentColor]);

  const fetchBrandingSettings = async (organizationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/branding`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setBrandingSettings(prev => ({
            ...prev,
            primaryColor: data.branding.primary_color || '#0f172a',
            secondaryColor: data.branding.secondary_color || '#64748b',
            accentColor: data.branding.accent_color || '#2563eb'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (formData: any) => {
    try {
      setLoading(true);
      setBrandingSettings(formData);
      
      // Save color settings to the server
      if (organization?.id) {
        const brandingData = {
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          accent_color: formData.accentColor
        };

        const response = await fetch(`/api/organizations/${organization.id}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(brandingData),
        });

        if (!response.ok) {
          throw new Error('Failed to save branding settings');
        }

        // Trigger theme update
        window.dispatchEvent(new Event('organizationBrandingUpdated'));
      }
      
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
    } finally {
      setLoading(false);
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

  // Show admin loading with timeout handling
  if (adminLoading && !adminTimeout) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If admin loading timed out or there's an error, show a fallback
  if (adminTimeout || adminError) {
    console.warn('Admin check timed out or failed, showing fallback view');
    // Continue to show the page - assume user can view but not edit
  }

  // Show read-only view for non-admin users (but not when admin check fails)
  if (!isAdmin && !adminTimeout && !adminError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Company Branding</h1>
          <p className="text-gray-600 mt-2">View your organization's branding settings</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔒</span>
              Admin Access Required
            </CardTitle>
            <CardDescription>
              Only organization administrators can modify branding settings. Contact your admin to make changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Company Name</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {brandingSettings.companyName || organization?.name || 'Not set'}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Logo</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {brandingSettings.logoUrl ? (
                  <img src={brandingSettings.logoUrl} alt="Company logo" className="h-12 w-auto" />
                ) : (
                  'No logo uploaded'
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SettingsForm
      title="Company Branding"
      description="Customize your organization's visual appearance with logo, colors, and branding elements."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={brandingSettings}
    >
      <Tabs defaultValue="logo" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="logo">Logo & Identity</TabsTrigger>
          <TabsTrigger value="colors">Colors & Theme</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logo" className="space-y-6">
          <LogoUploader />
        </TabsContent>
        
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize your organization's color scheme. These colors will be applied throughout the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-3">
                    <ColorPicker
                      color={brandingSettings.primaryColor}
                      onChange={(color) => {
                        setBrandingSettings(prev => ({ ...prev, primaryColor: color }));
                        // Dispatch formdata event to trigger save button
                        document.dispatchEvent(new CustomEvent('formdata', {
                          bubbles: true,
                          detail: { primaryColor: color }
                        }));
                      }}
                      disabled={loading}
                    />
                    <Input
                      id="primaryColor"
                      type="text"
                      value={brandingSettings.primaryColor}
                      onChange={(e) => {
                        setBrandingSettings(prev => ({ ...prev, primaryColor: e.target.value }));
                        // Dispatch formdata event to trigger save button
                        document.dispatchEvent(new CustomEvent('formdata', {
                          bubbles: true,
                          detail: { primaryColor: e.target.value }
                        }));
                      }}
                      placeholder="#0f172a"
                      className="w-24"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Main brand color for headers and primary elements</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-3">
                    <ColorPicker
                      color={brandingSettings.secondaryColor}
                      onChange={(color) => {
                        setBrandingSettings(prev => ({ ...prev, secondaryColor: color }));
                        // Dispatch formdata event to trigger save button
                        document.dispatchEvent(new CustomEvent('formdata', {
                          bubbles: true,
                          detail: { secondaryColor: color }
                        }));
                      }}
                      disabled={loading}
                    />
                    <Input
                      id="secondaryColor"
                      type="text"
                      value={brandingSettings.secondaryColor}
                      onChange={(e) => {
                        setBrandingSettings(prev => ({ ...prev, secondaryColor: e.target.value }));
                        // Dispatch formdata event to trigger save button
                        document.dispatchEvent(new CustomEvent('formdata', {
                          bubbles: true,
                          detail: { secondaryColor: e.target.value }
                        }));
                      }}
                      placeholder="#64748b"
                      className="w-24"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Secondary color for text and subtle elements</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-3">
                    <ColorPicker
                      color={brandingSettings.accentColor}
                      onChange={(color) => {
                        setBrandingSettings(prev => ({ ...prev, accentColor: color }));
                        // Dispatch formdata event to trigger save button
                        document.dispatchEvent(new CustomEvent('formdata', {
                          bubbles: true,
                          detail: { accentColor: color }
                        }));
                      }}
                      disabled={loading}
                    />
                    <Input
                      id="accentColor"
                      type="text"
                      value={brandingSettings.accentColor}
                      onChange={(e) => {
                        setBrandingSettings(prev => ({ ...prev, accentColor: e.target.value }));
                        // Dispatch formdata event to trigger save button
                        document.dispatchEvent(new CustomEvent('formdata', {
                          bubbles: true,
                          detail: { accentColor: e.target.value }
                        }));
                      }}
                      placeholder="#2563eb"
                      className="w-24"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Accent color for buttons, links, and highlights</p>
                </div>
              </div>
              
              {/* Color Preview */}
              <div className="mt-8">
                <Label className="text-base font-medium">Preview</Label>
                <div className="mt-3 p-4 border rounded-lg">
                  <div className="space-y-3">
                    <div 
                      className="h-8 rounded flex items-center px-3 text-white font-medium"
                      style={{ backgroundColor: brandingSettings.primaryColor }}
                    >
                      Primary Color Sample
                    </div>
                    <div 
                      className="h-8 rounded flex items-center px-3 text-white font-medium"
                      style={{ backgroundColor: brandingSettings.secondaryColor }}
                    >
                      Secondary Color Sample
                    </div>
                    <div 
                      className="h-8 rounded flex items-center px-3 text-white font-medium"
                      style={{ backgroundColor: brandingSettings.accentColor }}
                    >
                      Accent Color Sample
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SettingsForm>
  );
} 