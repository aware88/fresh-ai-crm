'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleAuthTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Test our simple auth endpoint
  const testAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-simple-auth', {
        credentials: 'include', // This is the key part we fixed
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (!response.ok) {
        setError(`Error ${response.status}: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error testing auth:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test the suppliers API
  const testSuppliersApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/suppliers', {
        credentials: 'include', // This is the key part we fixed
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error testing suppliers API:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simple Authentication Test</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This page tests if our authentication fixes are working correctly.
          You need to be logged in to see successful results.
        </p>
        
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={testAuth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Testing...' : 'Test Simple Auth'}
          </button>
          
          <button 
            onClick={testSuppliersApi}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Testing...' : 'Test Suppliers API'}
          </button>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
        
        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-200 rounded text-red-700">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-gray-100 border border-gray-200 rounded">
            <p className="font-semibold mb-2">Result:</p>
            <pre className="bg-white p-3 rounded border overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded border border-blue-100">
        <h2 className="text-lg font-semibold mb-2">How to use this test:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>First, make sure you're logged in to the application</li>
          <li>Click "Test Simple Auth" to check if authentication is working</li>
          <li>If successful, you'll see your user information</li>
          <li>Click "Test Suppliers API" to check if the suppliers API is working</li>
          <li>If you see a 401 error, it means you're not properly logged in</li>
        </ol>
      </div>
    </div>
  );
}
