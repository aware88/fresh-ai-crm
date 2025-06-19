'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: any;
}

export default function AuthDebugPage() {
  const { data: session, status } = useSession();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTests(prev => [...prev, result]);
  };

  const clearTests = () => {
    setTests([]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    clearTests();

    // Test 1: Check NextAuth Session
    addTestResult({
      name: 'NextAuth Session Status',
      status: status === 'authenticated' ? 'pass' : 'fail',
      message: `Session status: ${status}`,
      details: { status, session: session ? 'present' : 'null' }
    });

    // Test 2: Check Session Data
    if (session) {
      addTestResult({
        name: 'Session Data',
        status: session.user?.email ? 'pass' : 'fail',
        message: session.user?.email ? `User: ${session.user.email}` : 'No user email found',
        details: session
      });
    }

    // Test 3: Check Cookies
    const cookies = document.cookie;
    const hasSessionToken = cookies.includes('next-auth.session-token') || 
                           cookies.includes('__Secure-next-auth.session-token');
    
    addTestResult({
      name: 'Session Cookies',
      status: hasSessionToken ? 'pass' : 'fail',
      message: hasSessionToken ? 'Session token found in cookies' : 'No session token in cookies',
      details: { cookies: cookies || 'No cookies found' }
    });

    // Test 4: Test NextAuth Session API
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      addTestResult({
        name: 'NextAuth Session API',
        status: sessionData?.user?.email ? 'pass' : 'fail',
        message: sessionData?.user?.email ? `API returned user: ${sessionData.user.email}` : 'API returned no user',
        details: sessionData
      });
    } catch (error) {
      addTestResult({
        name: 'NextAuth Session API',
        status: 'fail',
        message: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    }

    // Test 5: Test Email Processing API
    try {
      const processRes = await fetch('/api/emails/process', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const processData = await processRes.json();
      
      addTestResult({
        name: 'Email Processing API',
        status: processRes.ok ? 'pass' : 'fail',
        message: `Status: ${processRes.status} - ${processData.message || 'No message'}`,
        details: { status: processRes.status, data: processData }
      });
    } catch (error) {
      addTestResult({
        name: 'Email Processing API',
        status: 'fail',
        message: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    }

    // Test 6: Check Environment Variables (client-side accessible ones)
    const hasNextAuthUrl = !!process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
    addTestResult({
      name: 'Environment Configuration',
      status: hasNextAuthUrl ? 'pass' : 'fail',
      message: hasNextAuthUrl ? 'NextAuth URL configured' : 'NextAuth URL missing',
      details: {
        origin: window.location.origin,
        nextAuthUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set (using origin)'
      }
    });

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-500';
      case 'fail': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Dashboard</CardTitle>
          <CardDescription>
            Comprehensive testing of NextAuth authentication flow
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Current Status</h3>
            <div className="flex items-center gap-2">
              <Badge variant={status === 'authenticated' ? 'default' : 'destructive'}>
                {status}
              </Badge>
              {session?.user?.email && (
                <span className="text-sm text-muted-foreground">
                  {session.user.email}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button onClick={runAuthTests} disabled={isRunning}>
              {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
            </Button>
            <Button variant="outline" onClick={clearTests}>
              Clear Results
            </Button>
            {status === 'authenticated' ? (
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            ) : (
              <Button variant="outline" onClick={() => signIn()}>
                Sign In
              </Button>
            )}
          </div>

          {/* Test Results */}
          {tests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <div className="space-y-2">
                {tests.map((test, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(test.status)}`} />
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <Badge variant={test.status === 'pass' ? 'default' : 'destructive'}>
                        {test.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{test.message}</p>
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">
                          Show Details
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {tests.length > 0 && (
            <Alert>
              <AlertDescription>
                <strong>Summary:</strong> {tests.filter(t => t.status === 'pass').length} passed, {' '}
                {tests.filter(t => t.status === 'fail').length} failed out of {tests.length} tests
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
