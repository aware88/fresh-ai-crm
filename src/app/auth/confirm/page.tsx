'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'debug'>('loading');
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!searchParams) {
        setStatus('error');
        setMessage('Invalid confirmation link. Missing URL parameters.');
        return;
      }

      // Extract all possible parameters for debugging
      const params = {
        access_token: searchParams.get('access_token'),
        refresh_token: searchParams.get('refresh_token'),
        token_hash: searchParams.get('token_hash'),
        type: searchParams.get('type'),
        confirmation_token: searchParams.get('confirmation_token'),
        token: searchParams.get('token'),
        error_code: searchParams.get('error_code'),
        error_description: searchParams.get('error_description'),
        code: searchParams.get('code'),
        state: searchParams.get('state')
      };

      // Set debug info for troubleshooting
      setDebugInfo(params);

      console.log('Confirmation parameters:', params);

      // Check for errors first
      if (params.error_code || params.error_description) {
        setStatus('error');
        setMessage(`Confirmation failed: ${params.error_description || params.error_code || 'Unknown error'}`);
        return;
      }

      // Method 1: Handle token-based confirmation (new format with access/refresh tokens)
      if (params.access_token && params.refresh_token) {
        try {
          console.log('Attempting token-based confirmation...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setMessage(`Confirmation failed: ${error.message}`);
            return;
          }

          if (data.user) {
            console.log('User confirmed successfully:', data.user);
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            
            // Redirect to sign in page after a short delay
            setTimeout(() => {
              router.push('/signin?message=Email confirmed successfully');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Confirmation failed. No user data received.');
          }
        } catch (error) {
          console.error('Unexpected error in token confirmation:', error);
          setStatus('error');
          setMessage('An unexpected error occurred during confirmation.');
        }
      }
      // Method 2: Handle hash-based confirmation (traditional format)
      else if (params.token_hash && params.type === 'signup') {
        try {
          console.log('Attempting hash-based confirmation...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: 'signup'
          });

          if (error) {
            console.error('Error verifying OTP:', error);
            setStatus('error');
            setMessage(`Confirmation failed: ${error.message}`);
            return;
          }

          if (data.user) {
            console.log('User confirmed via hash:', data.user);
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            
            setTimeout(() => {
              router.push('/signin?message=Email confirmed successfully');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Confirmation failed. Please try again.');
          }
        } catch (error) {
          console.error('Unexpected error in hash confirmation:', error);
          setStatus('error');
          setMessage('An unexpected error occurred during confirmation.');
        }
      }
      // Method 3: Handle simple token confirmation
      else if (params.token && params.type === 'signup') {
        try {
          console.log('Attempting simple token confirmation...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: params.token,
            type: 'signup'
          });

          if (error) {
            console.error('Error verifying token:', error);
            setStatus('error');
            setMessage(`Confirmation failed: ${error.message}`);
            return;
          }

          if (data.user) {
            console.log('User confirmed via token:', data.user);
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            
            setTimeout(() => {
              router.push('/signin?message=Email confirmed successfully');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Confirmation failed. Please try again.');
          }
        } catch (error) {
          console.error('Unexpected error in token confirmation:', error);
          setStatus('error');
          setMessage('An unexpected error occurred during confirmation.');
        }
      }
      // Method 4: Handle confirmation token format (alternative format)
      else if (params.confirmation_token) {
        try {
          console.log('Attempting confirmation token method...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: params.confirmation_token,
            type: 'signup'
          });

          if (error) {
            console.error('Error with confirmation token:', error);
            setStatus('error');
            setMessage(`Confirmation failed: ${error.message}`);
            return;
          }

          if (data.user) {
            console.log('User confirmed via confirmation token:', data.user);
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            
            setTimeout(() => {
              router.push('/signin?message=Email confirmed successfully');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Confirmation failed. Please try again.');
          }
        } catch (error) {
          console.error('Unexpected error with confirmation token:', error);
          setStatus('error');
          setMessage('An unexpected error occurred during confirmation.');
        }
      }
      // Method 5: Handle OAuth-style code parameter
      else if (params.code) {
        try {
          console.log('Attempting OAuth code exchange...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

          if (error) {
            console.error('Error exchanging code:', error);
            setStatus('error');
            setMessage(`Confirmation failed: ${error.message}`);
            return;
          }

          if (data.user) {
            console.log('User confirmed via code exchange:', data.user);
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            
            setTimeout(() => {
              router.push('/signin?message=Email confirmed successfully');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Confirmation failed. Please try again.');
          }
        } catch (error) {
          console.error('Unexpected error in code exchange:', error);
          setStatus('error');
          setMessage('An unexpected error occurred during confirmation.');
        }
      }
      // No valid confirmation parameters found
      else {
        console.log('No valid confirmation parameters found');
        setStatus('debug');
        setMessage('No valid confirmation parameters found. This might be a configuration issue.');
      }
    };

    handleConfirmation();
  }, [searchParams, router]);

  const handleGoToSignIn = () => {
    router.push('/signin');
  };

  const handleShowDebug = () => {
    setStatus('debug');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {(status === 'error' || status === 'debug') && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
            {status === 'debug' && 'Debug Information'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {status === 'loading' && 'Please wait while we confirm your email address.'}
            {status === 'success' && 'Your email has been successfully confirmed.'}
            {status === 'error' && 'There was an issue confirming your email.'}
            {status === 'debug' && 'Technical details for troubleshooting.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={`${
            status === 'success' ? 'border-green-200 bg-green-50' :
            status === 'error' ? 'border-red-200 bg-red-50' :
            status === 'debug' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <AlertDescription className={`${
              status === 'success' ? 'text-green-800' :
              status === 'error' ? 'text-red-800' :
              status === 'debug' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {message}
            </AlertDescription>
          </Alert>

          {status === 'debug' && debugInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">URL Parameters:</h4>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {status === 'success' && (
              <p className="text-sm text-gray-600 text-center">
                Redirecting to sign in page in a few seconds...
              </p>
            )}
            
            <Button
              onClick={handleGoToSignIn}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {status === 'success' ? 'Continue to Sign In' : 'Go to Sign In'}
            </Button>

            {status === 'error' && (
              <Button
                onClick={handleShowDebug}
                variant="outline"
                className="w-full"
              >
                Show Debug Information
              </Button>
            )}
          </div>

          {status === 'error' && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <a 
                  href="mailto:support@yoursite.com" 
                  className="text-purple-600 hover:text-purple-500"
                >
                  Contact Support
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  );
} 