'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        console.log('Sign in successful');
      }
    } catch (err) {
      setError('An error occurred during sign in');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      console.log('Sign out successful');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const testSettingsPage = () => {
    router.push('/settings/user-identity');
  };

  const testDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
          <CardDescription>
            Test the authentication system and debug session issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Status */}
          <div className="space-y-2">
            <Label>Session Status:</Label>
            <Badge variant={status === 'authenticated' ? 'default' : status === 'loading' ? 'secondary' : 'destructive'}>
              {status}
            </Badge>
          </div>

          {/* Session Data */}
          {session && (
            <div className="space-y-2">
              <Label>Session Data:</Label>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <pre>{JSON.stringify(session, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          {status !== 'authenticated' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email:</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password:</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* Sign Out Button */}
          {status === 'authenticated' && (
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          )}

          {/* Test Navigation */}
          <div className="space-y-2">
            <Label>Test Navigation:</Label>
            <div className="flex space-x-2">
              <Button onClick={testSettingsPage} variant="outline">
                Test Settings Page
              </Button>
              <Button onClick={testDashboard} variant="outline">
                Test Dashboard
              </Button>
            </div>
          </div>

          {/* API Test */}
          <div className="space-y-2">
            <Label>API Tests:</Label>
            <div className="flex space-x-2">
              <Button 
                onClick={() => fetch('/api/auth/session').then(r => r.json()).then(console.log)}
                variant="outline"
                size="sm"
              >
                Test Session API
              </Button>
              <Button 
                onClick={() => fetch('/api/user-identity').then(r => r.json()).then(console.log)}
                variant="outline"
                size="sm"
              >
                Test User Identity API
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Try signing in with the test credentials</li>
              <li>Check the session status and data</li>
              <li>Test navigation to settings and dashboard</li>
              <li>Check the browser console for any errors</li>
              <li>Use the API test buttons to check endpoint responses</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
