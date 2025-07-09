'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState({
    suppliers: { status: 'pending', message: 'Not started' },
    emails: { status: 'pending', message: 'Not started' },
    supplierEmails: { status: 'pending', message: 'Not started' }
  });
  const [supplierId, setSupplierId] = useState('');
  const [emailId, setEmailId] = useState('');

  const testSuppliers = async () => {
    setResults(prev => ({
      ...prev,
      suppliers: { status: 'running', message: 'Testing suppliers API...' }
    }));
    
    try {
      const response = await fetch('/api/suppliers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch suppliers: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setSupplierId(data[0].id);
        setResults(prev => ({
          ...prev,
          suppliers: { 
            status: 'success', 
            message: `Successfully fetched ${data.length} suppliers. First supplier ID: ${data[0].id}` 
          }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          suppliers: { 
            status: 'success', 
            message: 'Successfully fetched suppliers, but no suppliers found' 
          }
        }));
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        suppliers: { 
          status: 'error', 
          message: `Error: ${error.message}` 
        }
      }));
    }
  };

  const testEmails = async () => {
    setResults(prev => ({
      ...prev,
      emails: { status: 'running', message: 'Testing emails API...' }
    }));
    
    try {
      const response = await fetch('/api/emails?top=5', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch emails: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        setEmailId(data.data[0].id);
        setResults(prev => ({
          ...prev,
          emails: { 
            status: 'success', 
            message: `Successfully fetched ${data.data.length} emails. First email ID: ${data.data[0].id}` 
          }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          emails: { 
            status: 'success', 
            message: 'Successfully fetched emails, but no emails found' 
          }
        }));
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        emails: { 
          status: 'error', 
          message: `Error: ${error.message}` 
        }
      }));
    }
  };

  const testSupplierEmails = async () => {
    if (!supplierId) {
      setResults(prev => ({
        ...prev,
        supplierEmails: { 
          status: 'error', 
          message: 'No supplier ID available. Please run the suppliers test first.' 
        }
      }));
      return;
    }
    
    setResults(prev => ({
      ...prev,
      supplierEmails: { status: 'running', message: 'Testing supplier emails API...' }
    }));
    
    try {
      const response = await fetch(`/api/suppliers/emails?supplierId=${supplierId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch supplier emails: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setResults(prev => ({
          ...prev,
          supplierEmails: { 
            status: 'success', 
            message: `Successfully fetched ${data.length} supplier emails.` 
          }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          supplierEmails: { 
            status: 'success', 
            message: 'Successfully fetched supplier emails, but no emails found' 
          }
        }));
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        supplierEmails: { 
          status: 'error', 
          message: `Error: ${error.message}` 
        }
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/tests/login-test');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4">Loading session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Suppliers API</h2>
          <div className={`mb-2 ${getStatusColor(results.suppliers.status)}`}>
            Status: {results.suppliers.status}
          </div>
          <div className="mb-4 text-sm">
            {results.suppliers.message}
          </div>
          <button 
            onClick={testSuppliers}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Suppliers API
          </button>
        </div>
        
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Emails API</h2>
          <div className={`mb-2 ${getStatusColor(results.emails.status)}`}>
            Status: {results.emails.status}
          </div>
          <div className="mb-4 text-sm">
            {results.emails.message}
          </div>
          <button 
            onClick={testEmails}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Emails API
          </button>
        </div>
        
        <div className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Supplier Emails API</h2>
          <div className={`mb-2 ${getStatusColor(results.supplierEmails.status)}`}>
            Status: {results.supplierEmails.status}
          </div>
          <div className="mb-4 text-sm">
            {results.supplierEmails.message}
          </div>
          <button 
            onClick={testSupplierEmails}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!supplierId}
          >
            Test Supplier Emails API
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Test IDs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier ID
            </label>
            <input
              type="text"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Supplier ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email ID
            </label>
            <input
              type="text"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Email ID"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click "Test Suppliers API" to verify that you can fetch suppliers.</li>
          <li>Click "Test Emails API" to verify that you can fetch emails.</li>
          <li>After testing suppliers, click "Test Supplier Emails API" to verify that you can fetch emails for a specific supplier.</li>
          <li>If all tests pass with "success" status, the authentication fixes are working correctly.</li>
        </ol>
      </div>
    </div>
  );
}
