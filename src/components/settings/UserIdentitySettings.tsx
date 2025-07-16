'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
    
    // Emit formdata event for the parent SettingsForm
    document.dispatchEvent(new CustomEvent('formdata', {
      bubbles: true,
      detail: { [name]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
}
