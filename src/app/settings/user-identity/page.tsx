'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';
import { SettingsForm } from '@/components/settings/settings-form';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UserIdentityPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [identity, setIdentity] = useState({
    name: '',
    company: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

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

    // Only load identity if we have a session or if we're still loading
    if (status === 'authenticated' || status === 'loading') {
      loadIdentity();
    } else {
      setIsLoading(false);
    }
  }, [status]);

  // Handle authentication state changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Set a flag to show auth error instead of immediately redirecting
      setAuthError(true);
      setIsLoading(false);
    } else if (status === 'authenticated') {
      setAuthError(false);
    }
  }, [status]);

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

  const handleSignIn = () => {
    router.push('/signin');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError || status === 'unauthenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to be signed in to access your user identity settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Please sign in to view and manage your user identity settings.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleSignIn}>
              Sign In
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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