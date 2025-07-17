'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export function LogoUploader() {
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizationUser, setIsOrganizationUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check for logo and company name in localStorage on component mount
  useEffect(() => {
    // Load logo from localStorage
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setCurrentLogo(savedLogo);
    }
    
    // Load company name from localStorage
    const savedCompanyName = localStorage.getItem('companyName');
    if (savedCompanyName) {
      setCompanyName(savedCompanyName);
    }
    
    // If no logo in localStorage, fetch from API as fallback
    if (!savedLogo) {
      const fetchLogo = async () => {
        try {
          const response = await fetch('/api/logo/get');
          if (response.ok) {
            const data = await response.json();
            if (data.logoPath) {
              setCurrentLogo(data.logoPath);
              localStorage.setItem('companyLogo', data.logoPath);
              
              // Emit formdata event for the parent SettingsForm
              document.dispatchEvent(new CustomEvent('formdata', {
                bubbles: true,
                detail: { logoUrl: data.logoPath }
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching logo:', error);
        }
      };
      
      fetchLogo();
    }
  }, []);

  // Check if user is part of an organization
  useEffect(() => {
    const checkOrganizationMembership = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: membership, error } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1);

        if (error) {
          console.error('Error checking organization membership:', error);
          setIsOrganizationUser(false);
        } else {
          setIsOrganizationUser(membership && membership.length > 0);
        }
      } catch (error) {
        console.error('Error checking organization membership:', error);
        setIsOrganizationUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOrganizationMembership();
  }, [session, supabase]);

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

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCompanyName(newName);
    
    // Save company name to localStorage
    localStorage.setItem('companyName', newName.trim());
    
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
        
        // Dispatch a custom event to notify other components about the localStorage update
        window.dispatchEvent(new Event('localStorageUpdated'));
        
        // Emit formdata event for the parent SettingsForm
        document.dispatchEvent(new CustomEvent('formdata', {
          bubbles: true,
          detail: { logoUrl: data.logoPath }
        }));
        
        toast({
          title: "Logo uploaded successfully",
          description: "Your logo has been updated",
        });
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

  const handleRemoveLogo = () => {
    localStorage.removeItem('companyLogo');
    setCurrentLogo(null);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new Event('localStorageUpdated'));
    
    // Emit formdata event for the parent SettingsForm
    document.dispatchEvent(new CustomEvent('formdata', {
      bubbles: true,
      detail: { logoUrl: '' }
    }));
    
    toast({
      title: 'Logo removed',
      description: 'Your company logo has been removed',
    });
  };

  if (isLoading) {
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

  if (!isOrganizationUser) {
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Logo customization is only available for organization accounts. Individual users cannot upload custom logos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo & Branding
        </CardTitle>
        <CardDescription>
          Customize your organization's logo and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Current logo display */}
          {currentLogo && !previewUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Current Logo:</p>
              <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                <Image 
                  src={currentLogo} 
                  alt="Company Logo" 
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                />
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
          
          {/* Company name input */}
          <div className="w-full">
            <Label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </Label>
            <Input
              id="companyName"
              type="text"
              value={companyName}
              onChange={handleCompanyNameChange}
              placeholder="Enter your company name"
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be displayed next to your logo in the navigation bar
            </p>
          </div>
          
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
