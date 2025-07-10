'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

type EmailAccountFormData = {
  email: string;
  provider_type: string;
  username: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecurity: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: string;
  isActive: boolean;
};

type EditImapAccountFormProps = {
  userId: string;
  account: any; // The email account data
};

export default function EditImapAccountForm({ userId, account }: EditImapAccountFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [formData, setFormData] = useState<EmailAccountFormData>({
    email: account.email || '',
    provider_type: account.provider_type || 'IMAP',
    username: account.username || '',
    password: '', // Don't show existing password
    imapHost: account.imap_host || '',
    imapPort: account.imap_port || 993,
    imapSecurity: account.imap_security || 'SSL/TLS',
    smtpHost: account.smtp_host || '',
    smtpPort: account.smtp_port || 587,
    smtpSecurity: account.smtp_security || 'STARTTLS',
    isActive: account.is_active !== false, // Default to true if not set
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const testConnection = async (e: React.MouseEvent) => {
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
      const response = await fetch('/api/emails/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          imapSecurity: formData.imapSecurity,
          username: formData.username,
          password: formData.password
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Connection successful! ✅"
        });
        setTestSuccess(true); // Set success state to show banner
      } else {
        toast({
          title: "Error",
          description: `Connection failed: ${result.error}`,
          variant: "destructive"
        });
        setTestSuccess(false);
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.imapHost || !formData.imapPort || !formData.username) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Only include password if it was actually changed
      const payload = {
        ...formData,
        // Don't send empty password, which would indicate no change
        password: formData.password || undefined
      };
      
      const response = await fetch(`/api/emails/update/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Email account updated successfully!"
        });
        router.push('/settings/email-accounts');
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: `Failed to update account: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating email account:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating the email account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {testSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Connection successful!</strong> Your email account connection is working properly.
              </p>
              <div className="mt-4 flex space-x-3">
                <Link
                  href="/settings/email-accounts"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium"
                >
                  Back to Email Accounts
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Display Name (optional)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border rounded-md px-3 py-2"
            placeholder="Your Name"
          />
        </div>
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-4">IMAP Settings (Incoming Mail)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="imapHost" className="text-sm font-medium">
              IMAP Server <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="imapHost"
              name="imapHost"
              value={formData.imapHost}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="imap.example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="imapPort" className="text-sm font-medium">
              IMAP Port <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="imapPort"
              name="imapPort"
              value={formData.imapPort}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="993"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="imapSecurity" className="text-sm font-medium">
              Security Protocol
            </label>
            <select
              id="imapSecurity"
              name="imapSecurity"
              value={formData.imapSecurity}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="SSL/TLS">SSL/TLS</option>
              <option value="STARTTLS">STARTTLS</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-4">Authentication</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="usually your email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password {!account.password_encrypted && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder={account.password_encrypted ? "(unchanged)" : "Enter password"}
              required={!account.password_encrypted}
            />
            <p className="text-xs text-muted-foreground">
              We recommend using an app-specific password if your email provider supports it
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h2 className="text-lg font-semibold mb-4">SMTP Settings (Outgoing Mail) - Optional</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="smtpHost" className="text-sm font-medium">
              SMTP Server
            </label>
            <input
              type="text"
              id="smtpHost"
              name="smtpHost"
              value={formData.smtpHost}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="smtp.example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="smtpPort" className="text-sm font-medium">
              SMTP Port
            </label>
            <input
              type="number"
              id="smtpPort"
              name="smtpPort"
              value={formData.smtpPort}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="587"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="smtpSecurity" className="text-sm font-medium">
              Security Protocol
            </label>
            <select
              id="smtpSecurity"
              name="smtpSecurity"
              value={formData.smtpSecurity}
              onChange={handleInputChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="SSL/TLS">SSL/TLS</option>
              <option value="STARTTLS">STARTTLS</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleInputChange}
          className="h-4 w-4"
        />
        <label htmlFor="isActive">Account is active</label>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Link
          href="/settings/email-accounts"
          className="px-4 py-2 border border-gray-300 rounded-md text-center"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={testConnection}
          className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-md"
          disabled={isTesting}
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
