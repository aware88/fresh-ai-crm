'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserIdentityPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    redirect('/signin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">User Identity</h3>
        <p className="text-sm text-muted-foreground">
          Set your identity details to help the AI distinguish between your emails and customer emails in conversation threads.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Identity Settings</CardTitle>
          <CardDescription>
            This helps the AI focus on analyzing only the customer's communication style.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserIdentitySettings />
        </CardContent>
      </Card>
    </div>
  );
} 