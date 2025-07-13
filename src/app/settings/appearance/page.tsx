'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { SettingsForm } from '@/components/settings/settings-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';

interface AppearanceFormData {
  theme: string;
  fontSize: string;
}

export default function AppearanceSettings() {
  const { data: session } = useSession();
  const user = session?.user;
  const [theme, setTheme] = useState('system');
  const [fontSize, setFontSize] = useState('medium');
  
  const handleSaveSettings = async (formData: AppearanceFormData) => {
    const supabase = createClientComponentClient();
    
    // Save appearance settings to Supabase
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user?.id,
        theme: formData.theme,
        font_size: formData.fontSize,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw new Error(error.message);
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    if (formData.theme !== 'system') {
      document.documentElement.classList.add(formData.theme);
    }
  };
  
  const initialData: AppearanceFormData = {
    theme: 'system',
    fontSize: 'medium'
  };

  return (
    <SettingsForm
      title="Appearance"
      description="Customize the appearance of the application."
      backUrl="/settings"
      onSave={handleSaveSettings}
      initialData={initialData}
    >
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Select the theme for the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            defaultValue={theme} 
            onValueChange={(value) => {
              setTheme(value);
              const form = document.getElementById('appearance-form') as HTMLFormElement;
              if (form) {
                form.dispatchEvent(new CustomEvent('formdata', {
                  bubbles: true,
                  detail: { theme: value }
                }));
              }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem 
                value="light" 
                id="theme-light" 
                className="sr-only" 
              />
              <Label
                htmlFor="theme-light"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                  theme === 'light' ? 'border-primary' : ''
                }`}
              >
                <SunIcon className="h-6 w-6 mb-3" />
                <span className="text-sm font-medium">Light</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="dark" 
                id="theme-dark" 
                className="sr-only" 
              />
              <Label
                htmlFor="theme-dark"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                  theme === 'dark' ? 'border-primary' : ''
                }`}
              >
                <MoonIcon className="h-6 w-6 mb-3" />
                <span className="text-sm font-medium">Dark</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="system" 
                id="theme-system" 
                className="sr-only" 
              />
              <Label
                htmlFor="theme-system"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                  theme === 'system' ? 'border-primary' : ''
                }`}
              >
                <ComputerDesktopIcon className="h-6 w-6 mb-3" />
                <span className="text-sm font-medium">System</span>
              </Label>
            </div>
          </RadioGroup>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Font Size</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={fontSize === 'small' ? "default" : "outline"} 
                onClick={() => {
                  setFontSize('small');
                  const form = document.getElementById('appearance-form') as HTMLFormElement;
                  if (form) {
                    form.dispatchEvent(new CustomEvent('formdata', {
                      bubbles: true,
                      detail: { fontSize: 'small' }
                    }));
                  }
                }}
              >
                Small
              </Button>
              <Button 
                variant={fontSize === 'medium' ? "default" : "outline"}
                onClick={() => {
                  setFontSize('medium');
                  const form = document.getElementById('appearance-form') as HTMLFormElement;
                  if (form) {
                    form.dispatchEvent(new CustomEvent('formdata', {
                      bubbles: true,
                      detail: { fontSize: 'medium' }
                    }));
                  }
                }}
              >
                Medium
              </Button>
              <Button 
                variant={fontSize === 'large' ? "default" : "outline"}
                onClick={() => {
                  setFontSize('large');
                  const form = document.getElementById('appearance-form') as HTMLFormElement;
                  if (form) {
                    form.dispatchEvent(new CustomEvent('formdata', {
                      bubbles: true,
                      detail: { fontSize: 'large' }
                    }));
                  }
                }}
              >
                Large
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <form id="appearance-form" className="hidden"></form>
    </SettingsForm>
  );
}
