'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

type TestImapConnectionProps = {
  account: any;
  userId: string;
};

export default function TestImapConnection({ account, userId }: TestImapConnectionProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [password, setPassword] = useState('');

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      type ImapTestPayload = {
        email: any;
        imapHost: any;
        imapPort: any;
        imapSecurity: any;
        username: any;
        password?: string;
      };
      
      let payload: ImapTestPayload = {
        email: account.email,
        imapHost: account.imap_host,
        imapPort: account.imap_port,
        imapSecurity: account.imap_security,
        username: account.username || account.email,
      };
      
      // If showing password field, include the entered password
      // Otherwise, the backend will need to use the stored password
      if (showPasswordField && password) {
        payload.password = password;
      }
      
      const endpoint = showPasswordField && password
        ? '/api/emails/test-connection' // Uses the provided password
        : `/api/emails/test-stored/${account.id}`; // Uses the stored password
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the email server!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: `Failed to connect: ${result.error || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      setTestResult({
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
      toast({
        title: "Error",
        description: "An error occurred while testing the connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Account Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email Address</p>
            <p className="font-medium">{account.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">
              {account.provider_type === 'outlook' ? 'Microsoft Outlook' : 'IMAP/SMTP'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">IMAP Server</p>
            <p className="font-medium">{account.imap_host}:{account.imap_port}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`font-medium ${account.is_active ? 'text-green-600' : 'text-red-600'}`}>
              {account.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
          {account.smtp_host && (
            <div>
              <p className="text-sm text-gray-500">SMTP Server</p>
              <p className="font-medium">{account.smtp_host}:{account.smtp_port}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6 border-t pt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="use-custom-password"
            checked={showPasswordField}
            onChange={() => setShowPasswordField(!showPasswordField)}
            className="mr-2"
          />
          <label htmlFor="use-custom-password">
            Use a different password for this test
          </label>
        </div>
        
        {showPasswordField && (
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter password"
              required={showPasswordField}
            />
            <p className="text-xs text-gray-500 mt-1">
              This password will only be used for this test and won't be saved.
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleTestConnection}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {isLoading ? 'Testing Connection...' : 'Test Connection'}
        </button>
      </div>
      
      {testResult && (
        <div className={`p-4 rounded-md mb-6 ${
          testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {testResult.success ? (
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <h3 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </h3>
          </div>
          <p className={`mt-2 text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {testResult.success ? testResult.message : testResult.error}
          </p>
        </div>
      )}
      
      <div className="flex justify-between">
        <Link href="/settings/email-accounts" className="text-blue-600 hover:underline">
          Back to Email Accounts
        </Link>
        
        {account.provider_type === 'imap' && (
          <Link href={`/settings/email-accounts/edit/${account.id}`} className="text-blue-600 hover:underline">
            Edit Account Settings
          </Link>
        )}
      </div>
    </div>
  );
}
