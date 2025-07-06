"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TwoFactorAuthSetup } from '@/components/settings/TwoFactorAuthSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, KeyRound, History } from "lucide-react";
import { format } from 'date-fns';

interface AuthAttempt {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_successful: boolean;
  created_at: string;
}

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [recentAttempts, setRecentAttempts] = useState<AuthAttempt[]>([]);
  
  useEffect(() => {
    // Fetch recent login attempts when session is available
    if (status === 'authenticated' && session?.user) {
      fetchRecentAttempts();
    }
  }, [status, session]);
  
  const fetchRecentAttempts = async () => {
    try {
      const response = await fetch('/api/user/two-factor-auth/status');
      const data = await response.json();
      
      if (data.recentAttempts) {
        setRecentAttempts(data.recentAttempts);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent attempts:', error);
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
        <p>Please sign in to access your security settings.</p>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
      
      <Tabs defaultValue="2fa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="2fa">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Two-Factor Authentication
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2" />
            Recent Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="2fa" className="space-y-6">
          {session?.user && (
            <TwoFactorAuthSetup 
              userId={session.user.id} 
              userEmail={session.user.email || ''} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Authentication Activity
              </CardTitle>
              <CardDescription>
                Review recent login attempts and two-factor authentication verifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentAttempts.length > 0 ? (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 pl-4">Date & Time</th>
                        <th className="text-left p-2">IP Address</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b last:border-0">
                          <td className="p-2 pl-4">
                            {format(new Date(attempt.created_at), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="p-2">
                            {attempt.ip_address || 'Unknown'}
                          </td>
                          <td className="p-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${attempt.is_successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {attempt.is_successful ? 'Success' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No recent authentication activity found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
