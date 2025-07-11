'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

type ImapAccountFormProps = {
  userId: string;
};

type FormData = {
  email: string;
  name: string;
  imapHost: string;
  imapPort: string;
  imapSecurity: string;
  username: string;
  password: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecurity: string;
};

export default function ImapAccountForm({ userId }: ImapAccountFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    imapHost: '',
    imapPort: '993',
    imapSecurity: 'SSL/TLS',
    username: '',
    password: '',
    smtpHost: '',
    smtpPort: '587',
    smtpSecurity: 'STARTTLS',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!formData.imapHost || !formData.imapPort || !formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required IMAP fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsTesting(true);
    
    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: formData.imapHost,
          port: formData.imapPort,
          secure: formData.imapSecurity === 'SSL/TLS',
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to the server');
      }

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Successfully connected to the email server!',
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to the email server',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.email || !formData.imapHost || !formData.imapPort || !formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, check if the user is authenticated by fetching the session
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (!sessionData?.user?.id) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive"
        });
        router.push('/signin');
        return;
      }
      
      // Prepare account data with the confirmed user ID
      const accountData = {
        userId: sessionData.user.id, // Use the ID from the session to ensure it's current
        email: formData.email,
        name: formData.name || formData.email,
        providerType: 'imap',
        imapHost: formData.imapHost,
        imapPort: parseInt(formData.imapPort),
        imapSecurity: formData.imapSecurity,
        username: formData.username,
        password: formData.password,
        smtpHost: formData.smtpHost || formData.imapHost,
        smtpPort: formData.smtpPort ? parseInt(formData.smtpPort) : 587,
        smtpSecurity: formData.smtpSecurity,
        isActive: true,
      };
      
      console.log('Submitting IMAP account with user ID:', sessionData.user.id);
      
      // Submit the form data
      const response = await fetch('/api/auth/imap/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
        credentials: 'include', // Important: include credentials for auth
      });
      
      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Email account added successfully!"
        });
        
        // Add a small delay before redirecting to ensure toast is seen
        setTimeout(() => {
          router.push('/settings/email-accounts');
          router.refresh();
        }, 1000);
      } else {
        console.error('API error:', result.error);
        toast({
          title: "Error",
          description: `Failed to add email account: ${result.error || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error adding email account:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while adding the email account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use email address as display name
            </p>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">IMAP Settings (Incoming Mail)</h2>
          
          <div className="mb-4">
            <label htmlFor="imapHost" className="block text-sm font-medium text-gray-700 mb-1">
              IMAP Server Host*
            </label>
            <input
              type="text"
              id="imapHost"
              name="imapHost"
              value={formData.imapHost}
              onChange={handleChange}
              placeholder="e.g., imap.gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="imapPort" className="block text-sm font-medium text-gray-700 mb-1">
              IMAP Port*
            </label>
            <input
              type="text"
              id="imapPort"
              name="imapPort"
              value={formData.imapPort}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="imapSecurity" className="block text-sm font-medium text-gray-700 mb-1">
              Security
            </label>
            <select
              id="imapSecurity"
              name="imapSecurity"
              value={formData.imapSecurity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SSL/TLS">SSL/TLS</option>
              <option value="STARTTLS">STARTTLS</option>
              <option value="None">None (not recommended)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-6 pt-6">
        <h2 className="text-lg font-semibold mb-4">Authentication</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username*
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Usually your full email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="App-specific password recommended"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For better security, use an app-specific password if your provider supports it
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-6 pt-6">
        <h2 className="text-lg font-semibold mb-4">SMTP Settings (Outgoing Mail)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Optional: Configure these settings if you want to send emails from this account.
          Leave blank to use the IMAP server details.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Server Host
            </label>
            <input
              type="text"
              id="smtpHost"
              name="smtpHost"
              value={formData.smtpHost}
              onChange={handleChange}
              placeholder="e.g., smtp.gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Port
            </label>
            <input
              type="text"
              id="smtpPort"
              name="smtpPort"
              value={formData.smtpPort}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="smtpSecurity" className="block text-sm font-medium text-gray-700 mb-1">
              Security
            </label>
            <select
              id="smtpSecurity"
              name="smtpSecurity"
              value={formData.smtpSecurity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STARTTLS">STARTTLS</option>
              <option value="SSL/TLS">SSL/TLS</option>
              <option value="None">None (not recommended)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        {/* Test Connection Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            {isTesting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
        </div>
        
        {/* Action Buttons with proper spacing */}
        <div className="flex justify-end space-x-6">
          <Link 
            href="/settings/email-accounts" 
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center min-w-[120px]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center min-w-[120px] from-green-500 to-green-700 bg-gradient-to-r"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Account'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
