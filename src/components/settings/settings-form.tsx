'use client';

import React, { useState, ReactNode } from 'react';
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
  
  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };
  
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
  
  // Clone children and inject formData and handleChange
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        formData,
        onChange: handleChange,
      });
    }
    return child;
  });
  
  return (
    <div className="space-y-6">
      <NavigationHeader title={title} backUrl={backUrl} />
      
      <div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <Separator />
      
      {childrenWithProps}
      
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
