'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';

export default function UserIdentityPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [identity, setIdentity] = useState({
    name: '',
    company: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load saved identity on component mount
  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const response = await fetch('/api/user-identity');
        if (response.ok) {
          const data = await response.json();
          if (data.identity) {
            setIdentity(data.identity);
          }
        }
      } catch (error) {
        console.error('Error loading user identity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadIdentity();
  }, []);

  const handleSaveIdentity = async (formData: any) => {
    try {
      const response = await fetch('/api/user-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identity: formData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save identity');
      }
      
      setIdentity(formData);
    } catch (error) {
      console.error('Error saving user identity:', error);
      toast({
        title: "Error",
        description: "Failed to save identity settings. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/signin');
  }

  return (
    <SettingsForm
      title="User Identity"
      description="Set your identity details to help the AI distinguish between your emails and customer emails in conversation threads."
      backUrl="/settings"
      onSave={handleSaveIdentity}
      initialData={identity}
    >
      <UserIdentitySettings />
    </SettingsForm>
  );
} 