'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleOutlookTest() {
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  // Function to connect to Outlook
  const connectOutlook = async () => {
    try {
      setStatus('connecting');
      setError(null);
      
      // Redirect to the Outlook connect endpoint
      window.location.href = '/api/auth/outlook/connect';
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'An error occurred');
    }
  };

  // Function to test if we can access emails
  const testEmails = async () => {
    try {
      setStatus('testing');
      setError(null);
      
      const response = await fetch('/api/emails', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">CRM Mind - Outlook Connection Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <p>Current status: <span className="font-medium">{status}</span></p>
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={connectOutlook}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting...' : 'Connect Outlook'}
          </button>
          
          <button
            onClick={testEmails}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={status === 'testing'}
          >
            {status === 'testing' ? 'Testing...' : 'Test Email Access'}
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
      
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-100">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Make sure you're logged in to the CRM</li>
          <li>Click "Connect Outlook" to start the OAuth flow</li>
          <li>Follow the Microsoft authentication prompts</li>
          <li>After connecting, click "Test Email Access" to verify the connection</li>
        </ol>
      </div>
    </div>
  );
}
