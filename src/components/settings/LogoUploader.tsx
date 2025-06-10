'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, Image as ImageIcon, X } from 'lucide-react';

export function LogoUploader() {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
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
            }
          }
        } catch (error) {
          console.error('Error fetching logo:', error);
        }
      };
      
      fetchLogo();
    }
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
        setPreviewUrl(e.target?.result as string);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save company name to localStorage regardless of logo upload
    if (companyName.trim()) {
      localStorage.setItem('companyName', companyName.trim());
      toast({
        title: "Company name saved",
        description: "Your company name has been updated",
      });
    }
    
    // If no logo file is selected, just save the company name
    if (!logoFile) {
      if (!companyName.trim()) {
        toast({
          title: "No changes made",
          description: "Please enter a company name or select a logo file",
          variant: "destructive",
        });
      }
      return;
    }
    
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Logo</CardTitle>
        <CardDescription>
          Upload your company logo to display in the navigation bar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Current logo display */}
            {currentLogo && !previewUrl && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Current Logo:</p>
                <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                  <img 
                    src={currentLogo} 
                    alt="Company Logo" 
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
                  <img 
                    src={previewUrl} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Company name input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be displayed next to your logo in the navigation bar
              </p>
            </div>
            
            {/* File input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload New Logo
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.svg"
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
              <Button 
                type="submit" 
                disabled={isLoading && (!logoFile && !companyName.trim())}
                className="flex items-center"
              >
                {isLoading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {logoFile ? 'Upload Logo' : companyName.trim() ? 'Save Company Name' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
            
            {/* Remove logo button */}
            {currentLogo && (
              <div className="pt-4 border-t border-gray-200 mt-4">
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    localStorage.removeItem('companyLogo');
                    setCurrentLogo(null);
                    
                    // Dispatch a custom event to notify other components
                    window.dispatchEvent(new Event('localStorageUpdated'));
                    
                    toast({
                      title: 'Logo removed',
                      description: 'Your company logo has been removed',
                    });
                  }}
                  className="flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Logo
                </Button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
