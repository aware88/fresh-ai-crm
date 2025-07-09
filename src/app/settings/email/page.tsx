'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { FaEnvelope, FaCheck, FaTimes, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

export default function EmailSettings() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for success or error messages from OAuth flow
    if (searchParams) {
      const success = searchParams.get('success');
      const errorMsg = searchParams.get('error');
      
      if (success === 'true') {
        setError('');
        // We'll let the connection check below update the UI
      } else if (errorMsg) {
        setError(decodeURIComponent(errorMsg));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkConnection() {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/settings/email/status');
          const data = await response.json();
          
          if (data.success) {
            setConnected(data.connected);
            setEmail(data.email || '');
          } else {
            setError(data.error || 'Failed to check connection status');
          }
        } catch (err) {
          console.error('Error checking email connection:', err);
          setError('Failed to check connection status');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    checkConnection();
  }, [status, session]);

  const handleConnect = async () => {
    try {
      // Redirect to Microsoft OAuth flow
      window.location.href = '/api/auth/outlook/connect';
    } catch (err) {
      console.error('Error connecting to Outlook:', err);
      setError('Failed to initiate connection');
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/email/disconnect', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setConnected(false);
        setEmail('');
      } else {
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      console.error('Error disconnecting from Outlook:', err);
      setError('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Email Integration Settings</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Outlook Email Integration</h2>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div>
              <div className="flex items-center mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <FaCheck className="text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Connected to Outlook</p>
                  <p className="text-sm text-gray-600">{email}</p>
                </div>
              </div>
              
              <p className="mb-4 text-gray-700">
                Your Outlook account is connected to CRM Mind. You can view and manage your emails directly within the CRM.
              </p>
              
              <Button 
                onClick={handleDisconnect} 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <FaTimes className="mr-2" /> Disconnect Outlook
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800">Connect your Outlook account in just a few steps</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Follow these simple steps to connect your Outlook email and unlock powerful email integration features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">1</div>
                  <div className="ml-3">
                    <h4 className="font-medium">Click the Connect button</h4>
                    <p className="text-gray-600 text-sm mt-1">Start the secure connection process to link your Outlook account.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">2</div>
                  <div className="ml-3">
                    <h4 className="font-medium">Sign in to Microsoft</h4>
                    <p className="text-gray-600 text-sm mt-1">You'll be redirected to Microsoft's secure login page.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">3</div>
                  <div className="ml-3">
                    <h4 className="font-medium">Grant permissions</h4>
                    <p className="text-gray-600 text-sm mt-1">Allow CRM Mind to access your email, contacts, and calendar.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">4</div>
                  <div className="ml-3">
                    <h4 className="font-medium">You're all set!</h4>
                    <p className="text-gray-600 text-sm mt-1">Start using your Outlook account within CRM Mind.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleConnect} 
                  variant="default" 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  <FaEnvelope className="mr-2" /> Connect Outlook Account
                  <FaArrowRight className="ml-2" />
                </Button>
                
                <p className="text-xs text-gray-500 mt-2">
                  We use OAuth 2.0 for secure authentication. Your password is never stored.
                </p>
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium mb-3">Benefits of connecting:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">View and respond to emails without leaving the CRM</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Automatically link emails to contacts and companies</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Use AI-powered email suggestions and templates</span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">Track email engagement and follow-ups</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
