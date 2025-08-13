'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { NavigationHeader } from './navigation-header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SettingsFormProps {
  title: string;
  description: string;
  backUrl?: string;
  children: ReactNode;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export function SettingsForm({
  title,
  description,
  backUrl,
  children,
  onSave,
  initialData = {}
}: SettingsFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Listen for custom formdata events from child components
  useEffect(() => {
    const handleFormData = (event: CustomEvent) => {
      const newData = event.detail;
      setFormData((prev: any) => ({
        ...prev,
        ...newData
      }));
      setHasChanges(true);
    };

    // Add event listener for custom formdata events
    document.addEventListener('formdata', handleFormData as EventListener);
    
    return () => {
      document.removeEventListener('formdata', handleFormData as EventListener);
    };
  }, []);
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(formData);
      toast({
        title: "Settings Saved",
        description: "Your changes have been saved successfully.",
      });
      setHasChanges(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Footer actions */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="px-6"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
