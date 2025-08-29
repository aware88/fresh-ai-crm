'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useSimpleOrganizationAdmin } from '@/hooks/useSimpleOrganizationAdmin';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export function LogoUploader() {
  const { data: session } = useOptimizedAuth();
  const { isAdmin, loading: adminLoading } = useSimpleOrganizationAdmin();
  const supabase = createClientComponentClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [adminTimeout, setAdminTimeout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Add timeout for admin loading to prevent infinite loading
  useEffect(() => {
    console.log('LogoUploader: Admin loading state:', adminLoading, 'isAdmin:', isAdmin);
    if (adminLoading) {
      const timer = setTimeout(() => {
        console.log('LogoUploader: Admin loading timeout reached, setting adminTimeout to true');
        setAdminTimeout(true);
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setAdminTimeout(false);
    }
  }, [adminLoading, isAdmin]);

  // Listen for branding updates from parent component
  useEffect(() => {
    const handleBrandingUpdate = () => {
      // Check if branding settings have been updated in localStorage
      const updatedLogo = localStorage.getItem('companyLogo');
      const updatedCompanyName = localStorage.getItem('companyName');
      
      if (updatedLogo !== currentLogo) {
        setCurrentLogo(updatedLogo);
      }
      if (updatedCompanyName !== companyName) {
        setCompanyName(updatedCompanyName);
      }
    };

    // Listen for custom events that indicate branding has been updated
    window.addEventListener('organizationBrandingUpdated', handleBrandingUpdate);
    window.addEventListener('localStorageUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('organizationBrandingUpdated', handleBrandingUpdate);
      window.removeEventListener('localStorageUpdated', handleBrandingUpdate);
    };
  }, [currentLogo, companyName]);



  // Load branding data on component mount
  useEffect(() => {
    const loadBrandingData = async () => {
      try {
        console.log('LogoUploader: Loading branding data...');
        
        // Get current organization branding
        const orgResponse = await fetch('/api/user/preferences');
        const orgData = await orgResponse.json();
        const organizationId = orgData?.current_organization_id;
        
        if (!organizationId) {
          console.error('LogoUploader: No organization ID found');
          setIsLoading(false);
          return;
        }
        
        // Get organization branding using the organization ID
        const response = await fetch(`/api/organizations/${organizationId}/branding`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('LogoUploader: Branding API response:', data);
          
          if (data.branding && data.branding.logo_url) {
            console.log('LogoUploader: Setting current logo to:', data.branding.logo_url);
            setCurrentLogo(data.branding.logo_url);
            localStorage.setItem('companyLogo', data.branding.logo_url);
            
            // Emit formdata event for the parent SettingsForm
            document.dispatchEvent(new CustomEvent('formdata', {
              bubbles: true,
              detail: { logoUrl: data.branding.logo_url }
            }));
          }
          
          if (data.branding && data.branding.company_name) {
            setCompanyName(data.branding.company_name);
            localStorage.setItem('companyName', data.branding.company_name);
          }
        } else {
          // API failed, fallback to localStorage
          console.warn('Branding API failed, using localStorage fallback');
          const savedLogo = localStorage.getItem('companyLogo');
          if (savedLogo) {
            setCurrentLogo(savedLogo);
          }
          
          const savedCompanyName = localStorage.getItem('companyName');
          if (savedCompanyName) {
            setCompanyName(savedCompanyName);
          }
        }
      } catch (error) {
        console.error('Error fetching branding data:', error);
        // Fallback to localStorage on error
        const savedLogo = localStorage.getItem('companyLogo');
        if (savedLogo) {
          setCurrentLogo(savedLogo);
        }
        
        const savedCompanyName = localStorage.getItem('companyName');
        if (savedCompanyName) {
          setCompanyName(savedCompanyName);
        }
      } finally {
        // Set loading to false after data is loaded (regardless of success/failure)
        console.log('LogoUploader: Setting loading to false');
        setIsLoading(false);
      }
    };
    
    loadBrandingData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PNG, JPEG, or SVG file.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 2MB',
          variant: 'destructive',
        });
        return;
      }
      
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        
        // Emit formdata event for the parent SettingsForm
        document.dispatchEvent(new CustomEvent('formdata', {
          bubbles: true,
          detail: { logoUrl: result }
        }));
      };
      reader.readAsDataURL(file);
      
      toast({
        title: 'File selected',
        description: `${file.name} is ready to upload`,
      });
    }
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCompanyNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCompanyName(newName);
    
    // Save company name to localStorage for immediate UI update
    localStorage.setItem('companyName', newName.trim());
    
    // Update organization name in database
    if (session?.user?.id) {
      try {
        // Get current organization ID
        const response = await fetch('/api/user/preferences');
        const prefsData = await response.json();
        
        if (prefsData.preferences?.current_organization_id) {
          const trimmedName = newName.trim();
          
          // Update organization name in database (empty string if cleared)
          const updateResponse = await fetch(`/api/organizations/${prefsData.preferences.current_organization_id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: trimmedName // This will be empty string if field is cleared
            }),
          });
          
          if (updateResponse.ok) {
            console.log('✅ Organization name updated in database:', trimmedName || '(empty - will show ARIS)');
            // Trigger a refresh of organization data
            window.dispatchEvent(new Event('organizationUpdated'));
          } else {
            console.warn('⚠️ Failed to update organization name in database');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error updating organization name:', error);
      }
    }
    
    // Emit formdata event for the parent SettingsForm
    document.dispatchEvent(new CustomEvent('formdata', {
      bubbles: true,
      detail: { companyName: newName }
    }));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const response = await fetch('/api/logo/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      const data = await response.json();
      
      if (data.logoPath) {
        setCurrentLogo(data.logoPath);
        localStorage.setItem('companyLogo', data.logoPath);
        setPreviewUrl(null);
        setLogoFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Dispatch a custom event to notify other components about the update
        window.dispatchEvent(new Event('localStorageUpdated'));
        
        // Also dispatch an event to refresh organization branding
        window.dispatchEvent(new Event('organizationBrandingUpdated'));
        
        // Emit formdata event for the parent SettingsForm
        document.dispatchEvent(new CustomEvent('formdata', {
          bubbles: true,
          detail: { logoUrl: data.logoPath }
        }));
        
        toast({
          title: "Logo uploaded successfully",
          description: "Your logo has been updated and will appear immediately.",
        });

        // Force session refresh to update JWT token with new branding data immediately
        try {
          console.log('🔄 Refreshing session to update branding data...');
          
          // Trigger NextAuth session update - this will re-run the JWT callback
          const sessionResponse = await fetch('/api/auth/session?update=true', {
            method: 'GET',
            credentials: 'same-origin'
          });
          
          if (sessionResponse.ok) {
            console.log('✅ Session refreshed successfully');
            
            // Dispatch branding update event for real-time theme changes
            window.dispatchEvent(new CustomEvent('brandingUpdated', {
              detail: { branding: { logo_url: data.logoPath } }
            }));
            
            // Force a page refresh to ensure the new logo appears in navigation immediately
            setTimeout(() => {
              console.log('🔄 Reloading page to show new logo...');
              window.location.reload();
            }, 1000);
          } else {
            throw new Error('Session refresh failed');
          }
        } catch (sessionError) {
          console.error('❌ Failed to refresh session:', sessionError);
          
          // Fallback: still refresh the page to show the logo
          setTimeout(() => {
            console.log('🔄 Session refresh failed, reloading page anyway...');
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setIsLoading(true);
      
      // Get current organization branding
      const orgResponse = await fetch('/api/user/preferences');
      const orgData = await orgResponse.json();
      const organizationId = orgData?.current_organization_id;
      
      if (!organizationId) {
        throw new Error('No organization ID found');
      }
      
      // Update branding to remove logo_url
      const response = await fetch(`/api/organizations/${organizationId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo_url: null, // Explicitly set to null to remove logo
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove logo from server');
      }
      
      // Remove from localStorage
      localStorage.removeItem('companyLogo');
      setCurrentLogo(null);
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new Event('localStorageUpdated'));
      
      // Emit formdata event for the parent SettingsForm
      document.dispatchEvent(new CustomEvent('formdata', {
        bubbles: true,
        detail: { logoUrl: null }
      }));
      
      toast({
        title: 'Logo removed',
        description: 'Your company logo has been removed. Please sign out and sign back in to see the default ARIS logo.',
      });
      
      // Force session refresh to update JWT token with new branding data
      setTimeout(async () => {
        if (confirm('Logo removed successfully! To see the changes immediately, you need to refresh your session. Would you like to do this now?')) {
          try {
            // Try to trigger session update by calling the session endpoint
            await fetch('/api/auth/session', { 
              method: 'GET',
              cache: 'no-store'
            });
            
            // Force a hard page refresh to reload with new session
            window.location.reload();
          } catch (error) {
            console.error('Failed to refresh session:', error);
            // Fallback to sign out
            const { signOut } = await import('next-auth/react');
            signOut({ callbackUrl: '/signin' });
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove logo',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || (adminLoading && !adminTimeout)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo & Branding
          </CardTitle>
          <CardDescription>
            Customize your logo and company branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show read-only view for non-admin users (or if admin check timed out)
  if (!isAdmin && !adminTimeout) {
    return (
      <Card className="card-brand">
        <CardHeader className="card-header-brand">
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <CardTitle className="text-white">Logo & Branding</CardTitle>
          </div>
          <CardDescription className="text-white/80">
            Only organization administrators can modify logo and branding settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Show current logo (read-only) */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-primary">Current Company Name</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {companyName || 'Not set'}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-primary">Current Logo</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {currentLogo ? (
                  <div className="flex items-center justify-center">
                    <Image 
                      src={currentLogo} 
                      alt="Company Logo" 
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No logo uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              Contact your organization administrator to upload or change the company logo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-brand">
      <CardHeader className="card-header-brand">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-white" />
          <CardTitle className="text-white">Logo & Branding</CardTitle>
        </div>
        <CardDescription className="text-white/80">
          Customize your logo and company branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Current logo display */}
          {currentLogo && !previewUrl ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Current Logo:</p>
              <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                <Image 
                  src={currentLogo?.startsWith('/') ? `${currentLogo}?v=${Date.now()}` : currentLogo} 
                  alt="Company Logo" 
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load logo:', currentLogo);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center h-full bg-gray-50">
                        <span class="text-gray-400">Logo not found</span>
                      </div>`;
                    }
                  }}
                />
              </div>
            </div>
          ) : !previewUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">No Logo Uploaded:</p>
              <div className="flex items-center justify-center h-40 bg-gray-50 border rounded-md">
                <span className="text-gray-400">Default ARIS logo will be used</span>
              </div>
            </div>
          )}
          
          {/* Preview display */}
          {previewUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                <Image 
                  src={previewUrl} 
                  alt="Logo Preview" 
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          

          {/* File input */}
          <div className="w-full">
            <Label htmlFor="logoUpload" className="block text-sm font-medium text-gray-700 mb-1">
              Upload New Logo
            </Label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.svg"
                id="logoUpload"
                className="hidden"
              />
              <div 
                onClick={triggerFileUpload}
                className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm cursor-pointer hover:bg-gray-50"
              >
                <span className="truncate">
                  {logoFile ? logoFile.name : 'No file selected'}
                </span>
                {logoFile ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Recommended: PNG or SVG file with transparent background, max 2MB
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            {previewUrl && (
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setPreviewUrl(null);
                  setLogoFile(null);
                }}
              >
                Cancel
              </Button>
            )}
            {logoFile && (
              <Button 
                type="button" 
                onClick={handleUploadLogo}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload Logo
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Remove logo button */}
          {currentLogo && (
            <div className="pt-4 border-t border-gray-200 mt-4">
              <Button 
                type="button"
                variant="destructive"
                onClick={handleRemoveLogo}
                className="flex items-center"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Remove Logo
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LogoUploader;
