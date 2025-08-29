'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSimpleOrganizationAdmin } from '@/hooks/useSimpleOrganizationAdmin';

import { LogoUploader } from '@/components/settings/LogoUploader';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function BrandingPage() {
  const { data: session, status, isLoading } = useOptimizedAuth();
  const { organization } = useOrganization();
  const { isAdmin, loading: adminLoading, error: adminError } = useSimpleOrganizationAdmin();
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

  // Show loading state while session is being fetched
  if (status === 'loading' || isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if unauthenticated
  if (status === 'unauthenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to be signed in to access branding settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please sign in to view and manage your organization's branding settings.
          </p>
        </CardContent>
      </Card>
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
                {organization?.name || 'Not set'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Branding</h1>
        <p className="text-gray-600 mt-2">Customize your organization's visual appearance with logo, colors, and branding elements.</p>
      </div>
      
      <div className="space-y-6">
        {/* Logo & Identity */}
        <LogoUploader />
        
        {/* Colors & Branding */}
        <BrandingSettings />
      </div>
    </div>
  );
}