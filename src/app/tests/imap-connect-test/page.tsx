'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImapFormData {
  email: string;
  password: string;
  imapHost: string;
  imapPort: string;
  smtpHost: string;
  smtpPort: string;
  useTLS: boolean;
}

export default function ImapConnectTest() {
  const router = useRouter();
  const [formData, setFormData] = useState<ImapFormData>({
    email: '',
    password: '',
    imapHost: '',
    imapPort: '993',
    smtpHost: '',
    smtpPort: '587',
    useTLS: true,
  });
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    message: '',
    accountId: null as string | null,
  });
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('connecting');
    setError(null);

    try {
      const response = await fetch('/api/auth/imap/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        setConnectionStatus({
          connected: true,
          message: 'Connected successfully',
          accountId: data.accountId,
        });
        setStatus('success');
      } else {
        setStatus('error');
        setError(data.error || 'Failed to connect to IMAP server');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'An error occurred');
    }
  };

  const testConnection = async () => {
    if (!connectionStatus.accountId) {
      setTestResults({ success: false, error: 'Please connect your IMAP account first' });
      setTestStatus('error');
      return;
    }
    
    setTestStatus('testing');
    setTestResults(null);
    
    try {
      const response = await fetch(`/api/emails/test-imap?accountId=${connectionStatus.accountId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setTestResults(data);
      setTestStatus(data.success ? 'success' : 'error');
    } catch (error) {
      console.error('Error testing IMAP connection:', error);
      setTestStatus('error');
      setTestResults({ success: false, error: 'Failed to test connection' });
    }
  };

  // Common email providers presets
  const presets = {
    gmail: {
      imapHost: 'imap.gmail.com',
      imapPort: '993',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      useTLS: true,
    },
    outlook: {
      imapHost: 'outlook.office365.com',
      imapPort: '993',
      smtpHost: 'smtp.office365.com',
      smtpPort: '587',
      useTLS: true,
    },
    yahoo: {
      imapHost: 'imap.mail.yahoo.com',
      imapPort: '993',
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: '587',
      useTLS: true,
    },
  };

  const applyPreset = (preset: keyof typeof presets) => {
    setFormData({
      ...formData,
      ...presets[preset],
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">CRM Mind - IMAP Email Connection</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <p>Current status: <span className="font-medium">{status}</span></p>
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-green-700">
              Successfully connected to IMAP server!
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Quick Setup</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => applyPreset('gmail')}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Gmail
            </button>
            <button
              type="button"
              onClick={() => applyPreset('outlook')}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Outlook
            </button>
            <button
              type="button"
              onClick={() => applyPreset('yahoo')}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              Yahoo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="imapHost" className="block text-sm font-medium text-gray-700 mb-1">
                IMAP Server
              </label>
              <input
                type="text"
                id="imapHost"
                name="imapHost"
                value={formData.imapHost}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="imapPort" className="block text-sm font-medium text-gray-700 mb-1">
                IMAP Port
              </label>
              <input
                type="text"
                id="imapPort"
                name="imapPort"
                value={formData.imapPort}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Server
              </label>
              <input
                type="text"
                id="smtpHost"
                name="smtpHost"
                value={formData.smtpHost}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Port
              </label>
              <input
                type="text"
                id="smtpPort"
                name="smtpPort"
                value={formData.smtpPort}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useTLS"
                name="useTLS"
                checked={formData.useTLS}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useTLS" className="ml-2 block text-sm text-gray-900">
                Use TLS/SSL
              </label>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={status === 'connecting'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {status === 'connecting' ? 'Connecting...' : 'Connect IMAP'}
            </button>
            
            {status === 'success' && (
              <button
                type="button"
                onClick={testConnection}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Connection
              </button>
            )}
            
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Dashboard
            </button>
          </div>
        </form>
      </div>
      
      {result && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Connection Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {testResults && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <div className={`p-3 rounded ${testStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {testStatus === 'success' ? 'Successfully connected to IMAP server!' : 'Failed to connect to IMAP server'}
          </div>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 mt-4">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-100">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter your email address and password</li>
          <li>Provide your IMAP and SMTP server details (or use a preset)</li>
          <li>Click "Connect IMAP" to save your settings</li>
          <li>After connecting, click "Test Connection" to verify it works</li>
          <li>
            <strong>Note for Gmail users:</strong> You may need to create an "App Password" in your Google Account settings
            if you have 2-factor authentication enabled
          </li>
          <li>
            <strong>Note:</strong> Your credentials are securely stored in the CRM Mind database
          </li>
        </ol>
      </div>
    </div>
  );
}
