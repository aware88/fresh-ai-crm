'use client';

import { useState, useEffect } from 'react';

export default function DirectAuthTestPage() {
  const [results, setResults] = useState({
    suppliers: { status: 'pending', message: 'Not started' },
    emails: { status: 'pending', message: 'Not started' },
    supplierEmails: { status: 'pending', message: 'Not started' }
  });
  const [supplierId, setSupplierId] = useState('');

  // Test the suppliers API
  const testSuppliersApi = async () => {
    setResults(prev => ({
      ...prev,
      suppliers: { status: 'loading', message: 'Fetching suppliers...' }
    }));

    try {
      const response = await fetch('/api/suppliers', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Auto-select the first supplier ID for the supplier emails test
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
          suppliers: { status: 'success', message: 'Successfully fetched suppliers, but the list is empty.' }
        }));
      }
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      setResults(prev => ({
        ...prev,
        suppliers: { status: 'error', message: `Error: ${error.message}` }
      }));
    }
  };

  // Test the emails API
  const testEmailsApi = async () => {
    setResults(prev => ({
      ...prev,
      emails: { status: 'loading', message: 'Fetching emails...' }
    }));

    try {
      const response = await fetch('/api/emails?top=5', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        emails: { 
          status: 'success', 
          message: `Successfully fetched emails. Response: ${JSON.stringify(data).substring(0, 100)}...` 
        }
      }));
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      setResults(prev => ({
        ...prev,
        emails: { status: 'error', message: `Error: ${error.message}` }
      }));
    }
  };

  // Test the supplier emails API
  const testSupplierEmailsApi = async () => {
    if (!supplierId) {
      setResults(prev => ({
        ...prev,
        supplierEmails: { status: 'error', message: 'No supplier ID available. Please test suppliers API first.' }
      }));
      return;
    }

    setResults(prev => ({
      ...prev,
      supplierEmails: { status: 'loading', message: `Fetching emails for supplier ${supplierId}...` }
    }));

    try {
      const response = await fetch(`/api/suppliers/emails?supplierId=${supplierId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        supplierEmails: { 
          status: 'success', 
          message: `Successfully fetched supplier emails. Response: ${JSON.stringify(data).substring(0, 100)}...` 
        }
      }));
    } catch (error: any) {
      console.error('Error fetching supplier emails:', error);
      setResults(prev => ({
        ...prev,
        supplierEmails: { status: 'error', message: `Error: ${error.message}` }
      }));
    }
  };

  // Test all APIs
  const testAllApis = async () => {
    await testSuppliersApi();
    await testEmailsApi();
    // We'll test supplier emails after suppliers are fetched
    setTimeout(async () => {
      if (supplierId) {
        await testSupplierEmailsApi();
      }
    }, 1000);
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'loading': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Direct Authentication Test Page</h1>
      <p className="mb-4 text-gray-600">
        This page tests the API authentication fixes without requiring session redirects.
      </p>
      
      <div className="mb-6">
        <button 
          onClick={testAllApis}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-2"
        >
          Test All APIs
        </button>
        <button 
          onClick={testSuppliersApi}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Test Suppliers API
        </button>
        <button 
          onClick={testEmailsApi}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
        >
          Test Emails API
        </button>
        <button 
          onClick={testSupplierEmailsApi}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          disabled={!supplierId}
        >
          Test Supplier Emails API
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Suppliers Test Result */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Suppliers API</h2>
          <div className={`p-3 rounded ${getStatusColor(results.suppliers.status)}`}>
            <p className="font-medium">{results.suppliers.status.toUpperCase()}</p>
            <p>{results.suppliers.message}</p>
          </div>
        </div>
        
        {/* Emails Test Result */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Emails API</h2>
          <div className={`p-3 rounded ${getStatusColor(results.emails.status)}`}>
            <p className="font-medium">{results.emails.status.toUpperCase()}</p>
            <p>{results.emails.message}</p>
          </div>
        </div>
        
        {/* Supplier Emails Test Result */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Supplier Emails API</h2>
          <div className={`p-3 rounded ${getStatusColor(results.supplierEmails.status)}`}>
            <p className="font-medium">{results.supplierEmails.status.toUpperCase()}</p>
            <p>{results.supplierEmails.message}</p>
          </div>
          {supplierId && (
            <p className="mt-2 text-sm text-gray-600">Using supplier ID: {supplierId}</p>
          )}
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <p>This page makes direct API calls with <code>credentials: 'include'</code> to ensure cookies are sent.</p>
        <p>If you're seeing 401 errors, it means you're not authenticated. Try logging in through the main application first.</p>
      </div>
    </div>
  );
}
