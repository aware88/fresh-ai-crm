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
      <NavigationHeader title={title} backUrl={backUrl} />
      
      <div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <Separator />
      
      {/* Render children without injecting props */}
      {children}
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          className="px-6"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
