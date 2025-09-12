'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, Palette, RefreshCw } from "lucide-react";
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSimpleOrganizationAdmin } from '@/hooks/useSimpleOrganizationAdmin';
import { toast } from 'react-hot-toast';

interface BrandingData {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

const ARIS_DEFAULTS: BrandingData = {
  primary_color: '#3b82f6',
  secondary_color: '#8b5cf6',
  accent_color: '#3b82f6'
};

const PRESET_THEMES = [
  { name: 'ARIS Default', primary: '#3b82f6', secondary: '#8b5cf6', accent: '#3b82f6' },
  { name: 'Forest', primary: '#059669', secondary: '#34d399', accent: '#059669' },
  { name: 'Sunset', primary: '#dc2626', secondary: '#f87171', accent: '#dc2626' },
  { name: 'Ocean', primary: '#0284c7', secondary: '#38bdf8', accent: '#0284c7' },
  { name: 'Purple', primary: '#7c3aed', secondary: '#a78bfa', accent: '#7c3aed' },
  { name: 'Emerald', primary: '#10b981', secondary: '#6ee7b7', accent: '#10b981' },
];

export function BrandingSettings() {
  const { data: session, status } = useOptimizedAuth();
  const { organization } = useOrganization();
  const { isAdmin, loading: adminLoading } = useSimpleOrganizationAdmin();
  
  const [settings, setSettings] = useState<BrandingData>(ARIS_DEFAULTS);
  const [originalSettings, setOriginalSettings] = useState<BrandingData>(ARIS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to store timeout ID so it can be accessed across function calls
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const organizationId = organization?.id;
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  console.log('🎨 BrandingSettings render:', {
    status,
    organizationId,
    isAdmin,
    adminLoading,
    hasChanges,
    settings,
    originalSettings
  });

  useEffect(() => {
    console.log('🎨 BrandingSettings useEffect triggered:', { organization, status });
    
    if (status === 'loading' || adminLoading) {
      console.log('🎨 Still loading, waiting...');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('🎨 User not authenticated, using ARIS defaults');
      setSettings(ARIS_DEFAULTS);
      setOriginalSettings(ARIS_DEFAULTS);
      setLoading(false);
      return;
    }

    if (!organization) {
      console.log('🎨 No organization found, using ARIS defaults');
      setSettings(ARIS_DEFAULTS);
      setOriginalSettings(ARIS_DEFAULTS);
      setLoading(false);
      return;
    }

    const loadBrandingSettings = async () => {
      try {
        console.log('🎨 Loading branding settings for org:', organization.id);
        setLoading(true);
        setError(null);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout that will be cleared on success
        timeoutRef.current = setTimeout(() => {
          console.log('🎨 Loading timeout, falling back to ARIS defaults');
          setSettings(ARIS_DEFAULTS);
          setOriginalSettings(ARIS_DEFAULTS);
          setLoading(false);
          setError('Loading took too long, using ARIS defaults');
        }, 5000);

        const response = await fetch(`/api/organizations/${organization.id}/branding`);
        console.log('🎨 Branding API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🎨 Loaded branding data:', data);
          
          // Enhanced debugging
          console.log('🎨 Raw branding data:', data.branding);
          console.log('🎨 Expected Withcar colors: Primary=#ea580c, Secondary=#fb923c');
          
          if (data.branding) {
            const brandingData = {
              primary_color: data.branding.primary_color || ARIS_DEFAULTS.primary_color,
              secondary_color: data.branding.secondary_color || ARIS_DEFAULTS.secondary_color,
              accent_color: data.branding.accent_color || ARIS_DEFAULTS.accent_color
            };
            
            console.log('🎨 Processed branding data:', brandingData);
            console.log('🎨 Setting colors - Primary:', brandingData.primary_color, 'Secondary:', brandingData.secondary_color);
            
            // Clear timeout since we succeeded
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
              console.log('🎨 Cleared loading timeout - data loaded successfully');
            }
            
            setSettings(brandingData);
            setOriginalSettings(brandingData);
          } else {
            console.log('🎨 No branding object in response, using ARIS defaults');
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setSettings(ARIS_DEFAULTS);
            setOriginalSettings(ARIS_DEFAULTS);
          }
        } else {
          const errorText = await response.text();
          console.log('🎨 Failed to load branding, status:', response.status, 'error:', errorText);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setSettings(ARIS_DEFAULTS);
          setOriginalSettings(ARIS_DEFAULTS);
        }
      } catch (error) {
        console.error('🎨 Error loading branding settings:', error);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setError(`Failed to load branding: ${error}`);
        setSettings(ARIS_DEFAULTS);
        setOriginalSettings(ARIS_DEFAULTS);
      } finally {
        setLoading(false);
      }
    };

    loadBrandingSettings();

    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [organization, status, adminLoading]);

  const handleColorChange = (colorType: keyof BrandingData, value: string) => {
    console.log('🎨 Color change:', { colorType, value, hasChanges: JSON.stringify(settings) !== JSON.stringify(originalSettings) });
    setSettings(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const applyPreset = (preset: any) => {
    console.log('🎨 Applying preset:', preset);
    setSettings({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent
    });
  };

  const resetToDefaults = () => {
    console.log('🎨 Resetting to ARIS defaults');
    setSettings(ARIS_DEFAULTS);
  };

  const saveBrandingSettings = async () => {
    if (!organizationId || !isAdmin) {
      console.log('🎨 Cannot save: missing org ID or not admin', { organizationId, isAdmin });
      return;
    }

    console.log('🎨 Saving branding settings:', { settings, organizationId });
    
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/organizations/${organizationId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      console.log('🎨 Save response status:', response.status);

      if (response.ok) {
        setOriginalSettings(settings);
        toast.success('Branding settings saved successfully!');
        
        // Dispatch event to update theme
        window.dispatchEvent(new CustomEvent('brandingUpdated', { 
          detail: settings 
        }));
      } else {
        const errorData = await response.json();
        console.error('🎨 Save error:', errorData);
        toast.error('Failed to save branding settings');
      }
    } catch (error) {
      console.error('🎨 Save exception:', error);
      toast.error('Error saving branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Organization Branding
          </CardTitle>
          <CardDescription>
            Loading branding settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          {error && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Organization Branding
          </CardTitle>
          <CardDescription>
            Customize your organization's colors and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only organization administrators can modify branding settings.
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
            <Palette className="h-5 w-5 text-white" />
            <CardTitle className="text-white">Organization Branding</CardTitle>
          </div>
          <CardDescription className="text-white/80">
            Customize your organization's colors and branding. Changes apply to the entire application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-gray-100 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">🔧 Debug Info:</h4>
              <div className="space-y-1">
                <div>Organization ID: {organizationId}</div>
                <div>Current Primary: {settings.primary_color}</div>
                <div>Current Secondary: {settings.secondary_color}</div>
                <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
                <div>Has Changes: {hasChanges ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
          
          {/* Color Settings Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-brand rounded"></div>
              <h3 className="text-lg font-semibold text-primary">Brand Colors</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="primary_color" className="text-sm font-medium text-primary">Primary Color</Label>
                <div className="flex gap-3">
                  <div className="relative">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color || ARIS_DEFAULTS.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="w-16 h-12 p-1 rounded-lg border-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={settings.primary_color || ARIS_DEFAULTS.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1 focus-brand"
                  />
                </div>
                <p className="text-xs text-muted">Main brand color for headers and primary elements</p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="secondary_color" className="text-sm font-medium text-primary">Secondary Color</Label>
                <div className="flex gap-3">
                  <div className="relative">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color || ARIS_DEFAULTS.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="w-16 h-12 p-1 rounded-lg border-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={settings.secondary_color || ARIS_DEFAULTS.secondary_color}
                    onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1 focus-brand"
                  />
                </div>
                <p className="text-xs text-muted">Secondary color for accents and highlights</p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="accent_color" className="text-sm font-medium text-primary">Accent Color</Label>
                <div className="flex gap-3">
                  <div className="relative">
                    <Input
                      id="accent_color"
                      type="color"
                      value={settings.accent_color || ARIS_DEFAULTS.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      className="w-16 h-12 p-1 rounded-lg border-2 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={settings.accent_color || ARIS_DEFAULTS.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1 focus-brand"
                  />
                </div>
                <p className="text-xs text-muted">Accent color for interactive elements</p>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-brand rounded"></div>
              <h3 className="text-lg font-semibold text-primary">Live Preview</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="h-20 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: settings.primary_color || ARIS_DEFAULTS.primary_color }}
              >
                Primary
              </div>
              <div 
                className="h-20 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: settings.secondary_color || ARIS_DEFAULTS.secondary_color }}
              >
                Secondary
              </div>
              <div 
                className="h-20 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: settings.accent_color || ARIS_DEFAULTS.accent_color }}
              >
                Accent
              </div>
              <div 
                className="h-20 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${settings.primary_color || ARIS_DEFAULTS.primary_color}, ${settings.secondary_color || ARIS_DEFAULTS.secondary_color})` 
                }}
              >
                Gradient
              </div>
            </div>
          </div>

          {/* Quick Themes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-brand rounded"></div>
              <h3 className="text-lg font-semibold text-primary">Quick Themes</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {PRESET_THEMES.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto p-4 flex items-center gap-4 hover:shadow-md transition-all btn-brand-secondary justify-start"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              disabled={isSaving}
              className="flex items-center gap-2 btn-brand-secondary"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to ARIS Defaults
            </Button>
            
            <div className="flex items-center gap-4">
              {hasChanges && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-700 font-medium">Unsaved changes</span>
                </div>
              )}
              
              <Button
                onClick={saveBrandingSettings}
                disabled={!hasChanges || isSaving}
                className="flex items-center gap-2 btn-brand-primary px-6"
                title={`Save button: hasChanges=${hasChanges}, isSaving=${isSaving}, disabled=${!hasChanges || isSaving}`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Save Branding
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
    </Card>
  );
}