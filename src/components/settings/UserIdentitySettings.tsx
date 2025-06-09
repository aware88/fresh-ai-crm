'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';

interface UserIdentity {
  name: string;
  company: string;
  email: string;
}

export function UserIdentitySettings() {
  const [identity, setIdentity] = useState<UserIdentity>({
    name: '',
    company: '',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIdentity(prev => ({
      ...prev,
      [name]: value
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/user-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identity }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('Failed to save identity');
      }
    } catch (error) {
      console.error('Error saving user identity:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Identity</CardTitle>
          <CardDescription>Loading your identity settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Identity</CardTitle>
        <CardDescription>
          Set your identity to help the AI distinguish your emails from customer emails in conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="e.g., Tim Johnson" 
            value={identity.name}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input 
            id="company" 
            name="company" 
            placeholder="e.g., Bulk Nutrition" 
            value={identity.company}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Your Email Address</Label>
          <Input 
            id="email" 
            name="email" 
            type="email"
            placeholder="e.g., tim@bulknutrition.com" 
            value={identity.email}
            onChange={handleChange}
          />
          <p className="text-sm text-muted-foreground">
            This helps the AI identify which emails in a conversation are yours
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || (!identity.name && !identity.company && !identity.email)}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            'Save Identity'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
