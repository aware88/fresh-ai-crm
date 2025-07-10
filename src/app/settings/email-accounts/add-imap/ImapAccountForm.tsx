'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

type ImapAccountFormProps = {
  userId: string;
};

export default function ImapAccountForm({ userId }: ImapAccountFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
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
      // Create a temporary account object for testing
      const testData = {
        email: formData.email,
        imapHost: formData.imapHost,
        imapPort: parseInt(formData.imapPort),
        imapSecurity: formData.imapSecurity,
        username: formData.username,
        password: formData.password,
      };
      
      const response = await fetch('/api/emails/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Connection successful! ✅"
        });
      } else {
        toast({
          title: "Error",
          description: `Connection failed: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "An error occurred while testing the connection",
        variant: "destructive"
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
      const accountData = {
        userId,
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
      
      const response = await fetch('/api/auth/imap/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Email account added successfully!"
        });
        router.push('/settings/email-accounts');
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: `Failed to add account: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding email account:', error);
      toast({
        title: "Error",
        description: "An error occurred while adding the email account",
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
      
      <div className="flex justify-between mt-6">
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
        
        <div className="space-x-2">
          <Link 
            href="/settings/email-accounts" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
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
