'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!searchParams) {
        setStatus('error');
        setMessage('Invalid confirmation link. Missing URL parameters.');
        return;
      }

      // Get tokens from URL parameters
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      const expires_at = searchParams.get('expires_at');
      const token_type = searchParams.get('token_type');
      const type = searchParams.get('type');

      if (!access_token || !refresh_token) {
        setStatus('error');
        setMessage('Invalid confirmation link. Missing authentication tokens.');
        return;
      }

      try {
        // Set the session using the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Error setting session:', error);
          setStatus('error');
          setMessage(`Confirmation failed: ${error.message}`);
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in.');
          
          // Redirect to sign in page after a short delay
          setTimeout(() => {
            router.push('/signin?message=Email confirmed successfully');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Confirmation failed. Please try again.');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleConfirmation();
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully confirmed.'}
            {status === 'error' && 'There was an issue confirming your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-red-200 bg-red-50' : 
            'border-blue-200 bg-blue-50'
          }>
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/signin')}
                className="w-full"
                variant="outline"
              >
                Go to Sign In
              </Button>
              <Button 
                onClick={() => router.push('/signup')}
                className="w-full"
                variant="outline"
              >
                Try Sign Up Again
              </Button>
            </div>
          )}
          
          {status === 'success' && (
            <Button 
              onClick={() => router.push('/signin')}
              className="w-full"
            >
              Continue to Sign In
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 