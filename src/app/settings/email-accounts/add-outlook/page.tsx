'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { FaEnvelope, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

export default function AddOutlookPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // If not authenticated, redirect to sign in
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  const handleConnectOutlook = async () => {
    try {
      setLoading(true);
      // Redirect to the Outlook OAuth flow
      window.location.href = '/api/auth/outlook/connect';
    } catch (err) {
      console.error('Error connecting to Outlook:', err);
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Connect Outlook Account</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">Microsoft Outlook Integration</h2>
          <p className="text-gray-600">Connect your Outlook account to use it within CRM Mind</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaInfoCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    You'll be redirected to Microsoft to authorize access to your account. CRM Mind will not store your password.
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
                onClick={handleConnectOutlook} 
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <FaEnvelope className="mr-2" /> 
                {loading ? 'Connecting...' : 'Connect Outlook Account'}
                {!loading && <FaArrowRight className="ml-2" />}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2">
                We use OAuth 2.0 for secure authentication. Your password is never stored.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
