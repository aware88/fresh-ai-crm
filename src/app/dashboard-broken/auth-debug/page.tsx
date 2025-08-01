'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthDebugPage() {
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth-debug');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setAuthInfo(data);
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Authentication Debug</h1>
        <p className="text-muted-foreground">
          Diagnose authentication issues between client and server
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={checkAuth} disabled={loading}>
          {loading ? 'Checking...' : 'Refresh Auth Status'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {authInfo && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NextAuth Session</CardTitle>
              <CardDescription>
                Session from getServerSession() in API route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authInfo.nextAuthSession.exists ? (
                <div className="space-y-2">
                  <p><strong>User:</strong> {authInfo.nextAuthSession.user?.email || 'N/A'}</p>
                  <p><strong>Name:</strong> {authInfo.nextAuthSession.user?.name || 'N/A'}</p>
                  <p><strong>Expires:</strong> {authInfo.nextAuthSession.expires || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-amber-600 font-medium">No NextAuth session found!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supabase Session</CardTitle>
              <CardDescription>
                Session from supabase.auth.getSession() in API route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authInfo.supabaseSession.exists ? (
                <div className="space-y-2">
                  <p><strong>User:</strong> {authInfo.supabaseSession.user?.email || 'N/A'}</p>
                  <p><strong>ID:</strong> {authInfo.supabaseSession.user?.id || 'N/A'}</p>
                  <p><strong>Expires:</strong> {authInfo.supabaseSession.expires || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-amber-600 font-medium">No Supabase session found!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auth Cookies</CardTitle>
              <CardDescription>
                Auth-related cookies found in the request
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authInfo.authCookies.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {authInfo.authCookies.map((cookie: string) => (
                    <li key={cookie}>{cookie}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-amber-600 font-medium">No auth cookies found!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Headers</CardTitle>
              <CardDescription>
                Important headers in the API request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Authorization:</strong> {authInfo.headers.authorization ? 'Present' : 'Missing'}</p>
                <p><strong>Cookie:</strong> {authInfo.headers.cookie ? 'Present' : 'Missing'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
