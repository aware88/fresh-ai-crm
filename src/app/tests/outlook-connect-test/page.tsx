'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function OutlookConnectTest() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('checking');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();

  // Check if we're logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      setConnectionStatus('not-logged-in');
    } else if (status === 'authenticated') {
      setConnectionStatus('logged-in');
      checkOutlookConnection();
    }
  }, [status]);

  // Function to check if Outlook is connected
  const checkOutlookConnection = async () => {
    try {
      // Try to fetch emails as a test
      const response = await fetch('/api/emails', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setConnectionStatus('connected');
        setDebugInfo(data);
      } else if (response.status === 401) {
        setConnectionStatus('not-connected');
        setError(data.error || 'Not authenticated');
        setDebugInfo(data);
      } else {
        setConnectionStatus('error');
        setError(data.error || `Error ${response.status}`);
        setDebugInfo(data);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setError(err.message || 'An error occurred');
      console.error('Error checking Outlook connection:', err);
    }
  };

  // Function to connect Outlook
  const connectOutlook = async () => {
    try {
      setConnectionStatus('connecting');
      
      // First, check if we have the environment variables set
      const configResponse = await fetch('/api/test-simple-auth', {
        credentials: 'include',
      });
      
      if (!configResponse.ok) {
        setError('You need to be logged in to connect Outlook');
        setConnectionStatus('not-logged-in');
        return;
      }
      
      // Redirect to the Outlook connect endpoint
      window.location.href = '/api/auth/outlook/connect';
    } catch (err: any) {
      setConnectionStatus('error');
      setError(err.message || 'An error occurred');
      console.error('Error connecting to Outlook:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Outlook Connection Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        
        <div className="mb-4">
          <p className="mb-2"><strong>NextAuth Session:</strong> {status}</p>
          <p className="mb-2">
            <strong>Outlook Connection:</strong>{' '}
            {connectionStatus === 'checking' && 'Checking...'}
            {connectionStatus === 'not-logged-in' && 'Not logged in'}
            {connectionStatus === 'logged-in' && 'Logged in (Outlook status unknown)'}
            {connectionStatus === 'not-connected' && 'Not connected to Outlook'}
            {connectionStatus === 'connected' && 'Connected to Outlook'}
            {connectionStatus === 'connecting' && 'Connecting to Outlook...'}
            {connectionStatus === 'error' && 'Error connecting to Outlook'}
          </p>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          {(connectionStatus === 'not-connected' || connectionStatus === 'error') && (
            <button
              onClick={connectOutlook}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Outlook'}
            </button>
          )}
          
          <button
            onClick={checkOutlookConnection}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            disabled={connectionStatus === 'checking' || connectionStatus === 'not-logged-in'}
          >
            Check Connection
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        
        <ol className="list-decimal pl-5 space-y-3">
          <li>
            <strong>Create a Microsoft Azure App Registration:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Go to <a href="https://portal.azure.com" target="_blank" className="text-blue-600 hover:underline">Azure Portal</a></li>
              <li>Navigate to "App registrations" and click "New registration"</li>
              <li>Name your app (e.g., "CRM Mind")</li>
              <li>Set the redirect URI to: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/api/auth/outlook/callback</code></li>
              <li>Click "Register"</li>
            </ul>
          </li>
          
          <li>
            <strong>Configure API Permissions:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>In your new app registration, go to "API permissions"</li>
              <li>Add the following Microsoft Graph permissions:
                <ul className="list-disc pl-5">
                  <li>User.Read</li>
                  <li>Mail.Read</li>
                  <li>Mail.ReadWrite</li>
                  <li>Mail.Send</li>
                  <li>Calendars.Read</li>
                  <li>Contacts.Read</li>
                </ul>
              </li>
              <li>Click "Grant admin consent" for these permissions</li>
            </ul>
          </li>
          
          <li>
            <strong>Get Client Credentials:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Go to "Overview" and copy the "Application (client) ID"</li>
              <li>Go to "Certificates & secrets", create a new client secret, and copy it</li>
            </ul>
          </li>
          
          <li>
            <strong>Set Environment Variables:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Run the setup script: <code className="bg-gray-100 px-2 py-1 rounded">node setup-outlook-env.js</code></li>
              <li>Enter your Microsoft Client ID and Client Secret when prompted</li>
              <li>Restart your development server after updating the environment variables</li>
            </ul>
          </li>
          
          <li>
            <strong>Connect Outlook:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>Make sure you're logged in to the CRM</li>
              <li>Click the "Connect Outlook" button above</li>
              <li>Follow the Microsoft authentication flow</li>
            </ul>
          </li>
        </ol>
      </div>
      
      {debugInfo && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
