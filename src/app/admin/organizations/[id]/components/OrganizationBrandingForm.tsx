'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Toast } from '@/components/ui/toast';
import { BrandingFormData, defaultBrandingFormData } from '@/types/branding';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { Spinner } from '@/components/ui/spinner';

interface OrganizationBrandingFormProps {
  organizationId: string;
}

export function OrganizationBrandingForm({ organizationId }: OrganizationBrandingFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const form = useForm<BrandingFormData>({
    defaultValues: defaultBrandingFormData,
  });
  
  // Fetch existing branding data
  useEffect(() => {
    const fetchBranding = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}/branding`);
        if (response.ok) {
          const data = await response.json();
          if (data.branding) {
            // Reset form with fetched data
            form.reset(data.branding);
          }
        } else {
          console.error('Failed to fetch branding data');
        }
      } catch (error) {
        console.error('Error fetching branding data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranding();
  }, [organizationId, form]);
  
  // Submit handler
  const onSubmit = async (data: BrandingFormData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        // Show success message
const successToast = document.createElement('div');
successToast.innerHTML = 'Branding settings saved successfully';
successToast.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded fixed top-4 right-4 z-50';
document.body.appendChild(successToast);
setTimeout(() => document.body.removeChild(successToast), 3000);
      } else {
        const errorData = await response.json();
        // Show error message
const errorToast = document.createElement('div');
errorToast.innerHTML = `Failed to save branding settings: ${errorData.error || 'Unknown error'}`;
errorToast.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-4 right-4 z-50';
document.body.appendChild(errorToast);
setTimeout(() => document.body.removeChild(errorToast), 3000);
      }
    } catch (error) {
      console.error('Error saving branding settings:', error);
      // Show error message
const errorToast = document.createElement('div');
errorToast.innerHTML = 'An error occurred while saving branding settings';
errorToast.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-4 right-4 z-50';
document.body.appendChild(errorToast);
setTimeout(() => document.body.removeChild(errorToast), 3000);
    } finally {
      setSaving(false);
    }
  };
  
  // Preview component
  const BrandingPreview = () => {
    const primaryColor = form.watch('primary_color') || defaultBrandingFormData.primary_color;
    const secondaryColor = form.watch('secondary_color') || defaultBrandingFormData.secondary_color;
    const accentColor = form.watch('accent_color') || defaultBrandingFormData.accent_color;
    const fontFamily = form.watch('font_family') || defaultBrandingFormData.font_family;
    const logoUrl = form.watch('logo_url');
    
    return (
      <div className="p-4 border rounded-md">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        
        <div className="mb-4">
          {logoUrl ? (
            <div className="mb-2">
              <p className="text-sm text-gray-500 mb-1">Logo:</p>
              <img 
                src={logoUrl} 
                alt="Logo Preview" 
                className="h-12 object-contain" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                  console.error('Invalid logo URL');
                }}
              />
            </div>
          ) : (
            <div className="h-12 w-48 bg-gray-200 flex items-center justify-center text-sm text-gray-500">
              No Logo Set
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Primary Color:</p>
            <div 
              className="h-10 rounded-md" 
              style={{ backgroundColor: primaryColor || undefined }}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Secondary Color:</p>
            <div 
              className="h-10 rounded-md" 
              style={{ backgroundColor: secondaryColor || undefined }}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Accent Color:</p>
            <div 
              className="h-10 rounded-md" 
              style={{ backgroundColor: accentColor }}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Font Family:</p>
            <div 
              className="h-10 rounded-md border flex items-center px-3" 
              style={{ fontFamily: fontFamily || undefined }}
            >
              Sample Text
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-md" style={{ 
          backgroundColor: primaryColor || undefined,
          color: '#ffffff',
          fontFamily: fontFamily || undefined
        }}>
          <h4 className="font-medium mb-2">Header Example</h4>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              style={{ backgroundColor: accentColor }}
            >
              Primary Button
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              style={{ borderColor: secondaryColor || undefined, color: secondaryColor || undefined }}
            >
              Secondary Button
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Loading branding settings...</span>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Branding</CardTitle>
        <CardDescription>
          Customize the appearance of your organization's CRM instance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="favicon_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Favicon URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/favicon.ico" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="font_family"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Family</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Inter, system-ui, sans-serif" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="custom_domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Domain</FormLabel>
                      <FormControl>
                        <Input placeholder="app.yourcompany.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="login_background_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Background URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/background.jpg" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <ColorPicker 
                                color={field.value || defaultBrandingFormData.primary_color || '#0f172a'} 
                                onChange={field.onChange} 
                              />
                              <Input 
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="#0f172a" 
                                className="w-32" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="secondary_color"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <ColorPicker 
                                color={field.value || defaultBrandingFormData.secondary_color || '#64748b'} 
                                onChange={field.onChange} 
                              />
                              <Input 
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="#64748b" 
                                className="w-32" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accent_color"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Accent Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <ColorPicker 
                                color={field.value || defaultBrandingFormData.accent_color || '#2563eb'} 
                                onChange={field.onChange} 
                              />
                              <Input 
                                value={field.value || ''} 
                                onChange={field.onChange} 
                                placeholder="#2563eb" 
                                className="w-32" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <BrandingPreview />
                </div>
              </TabsContent>
              
              <TabsContent value="email" className="space-y-4">
                <FormField
                  control={form.control}
                  name="email_header_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Header Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/email-header.png" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email_footer_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Footer Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="© 2025 Your Company. All rights reserved." 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="custom_css"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom CSS</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder=".custom-class { color: red; }" 
                          {...field} 
                          value={field.value || ''} 
                          className="font-mono h-64" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : 'Save Branding Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
