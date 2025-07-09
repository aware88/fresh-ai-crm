'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SessionDebugPage() {
  const { data: session, status } = useSession();
  const [apiSession, setApiSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkApiSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-auth', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setApiSession(data);
    } catch (err: any) {
      setError(err.message || 'Failed to check API session');
      console.error('Error checking API session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiSession();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Session Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client-side Session */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Client-side Session (useSession hook)</h2>
          <div className="bg-gray-100 p-3 rounded">
            <p><strong>Status:</strong> {status}</p>
            {session ? (
              <pre className="mt-2 bg-gray-200 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(session, null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-red-600">No session data available</p>
            )}
          </div>
        </div>
        
        {/* Server-side Session */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Server-side Session (API check)</h2>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <span className="ml-2">Checking session...</span>
            </div>
          ) : error ? (
            <div className="bg-red-100 p-3 rounded text-red-700">
              <p><strong>Error:</strong> {error}</p>
            </div>
          ) : (
            <div className="bg-gray-100 p-3 rounded">
              <p><strong>Authenticated:</strong> {apiSession?.authenticated ? 'Yes' : 'No'}</p>
              <p><strong>Message:</strong> {apiSession?.message}</p>
              {apiSession?.session ? (
                <pre className="mt-2 bg-gray-200 p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(apiSession.session, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 text-amber-600">No session data from API</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <button 
          onClick={checkApiSession}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh API Session Check'}
        </button>
      </div>
      
      <div className="mt-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Cookie Debug</h2>
        <p className="mb-2">Current cookies (client-side only):</p>
        <pre className="bg-gray-200 p-2 rounded overflow-auto max-h-40">
          {document.cookie || '(No cookies found)'}
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          Note: HTTP-only cookies used for secure sessions won't be visible here
        </p>
      </div>
      
      <div className="mt-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <p>If you're seeing different results between client and server session checks, it could indicate:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Session cookies are not being properly sent with API requests</li>
          <li>Session validation is inconsistent between client and server</li>
          <li>The session is expired or invalid</li>
        </ul>
        <p className="mt-2">Try logging out and back in if sessions are not working properly.</p>
      </div>
    </div>
  );
}
