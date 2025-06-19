'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch session status
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        
        setSession(data);
        console.log('Session data:', data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to fetch session');
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, []);

  // Test API endpoint with session
  const testApiEndpoint = async () => {
    try {
      const res = await fetch('/api/emails/process', { 
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await res.json();
      alert(`API Response: ${res.status} ${res.statusText}\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error('Error calling API:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const signIn = () => {
    router.push('/signin');
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/signin');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
          <CardDescription>
            This page tests your NextAuth session and API endpoints
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-md">
            <h3 className="font-medium mb-2">Session Status:</h3>
            <pre className="text-xs overflow-auto max-h-60 bg-slate-200 p-2 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-800 p-4 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="space-x-2">
            {!session?.user ? (
              <Button onClick={signIn}>Sign In</Button>
            ) : (
              <Button variant="outline" onClick={signOut}>Sign Out</Button>
            )}
          </div>
          
          <Button 
            onClick={testApiEndpoint}
            variant="secondary"
          >
            Test API Endpoint
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
