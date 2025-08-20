'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';

function InvitationAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const handleInvitationVerification = async () => {
      if (!searchParams) {
        setStatus('error');
        setMessage('Invalid invitation link');
        return;
      }

      // Get URL parameters
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      console.log('🔗 Invitation parameters:', { token_hash, type });

      if (!token_hash) {
        setStatus('error');
        setMessage('Invalid invitation link - missing token');
        return;
      }

      if (type !== 'invite') {
        setStatus('error');
        setMessage('Invalid invitation type');
        return;
      }

      // Verify the invitation token
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'invite'
        });

        if (error) {
          console.error('❌ Invitation verification error:', error);
          setStatus('error');
          setMessage(`Invitation verification failed: ${error.message}`);
          return;
        }

        if (data.user) {
          console.log('✅ Invitation verified for user:', data.user.email);
          setUserEmail(data.user.email || '');
          setStatus('form');
          setMessage(`Welcome ${data.user.user_metadata?.first_name || 'User'}! Please set your password to complete your account setup.`);
        } else {
          setStatus('error');
          setMessage('Invalid invitation token');
        }
      } catch (error) {
        console.error('❌ Unexpected error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred while verifying your invitation');
      }
    };

    handleInvitationVerification();
  }, [searchParams]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setMessage(`Failed to set password: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Password set successfully');
      setStatus('success');
      setMessage('Account setup completed! You can now sign in with your new password.');
      
      // Redirect to sign in page after a short delay
      setTimeout(() => {
        router.push('/signin?message=Account setup completed successfully');
      }, 3000);

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setMessage('An unexpected error occurred while setting your password');
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Verifying your invitation...</p>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ARIS!</h2>
              <p className="text-gray-600">
                {userEmail && `Invitation accepted for ${userEmail}`}
              </p>
            </div>

            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password (min 8 characters)"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  'Complete Account Setup'
                )}
              </Button>
            </form>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Account Setup Complete!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to sign in page...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Invitation Error</h2>
            <p className="text-gray-600">{message}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/signin')}
                variant="outline"
                className="w-full"
              >
                Go to Sign In
              </Button>
              <p className="text-sm text-gray-500">
                If you continue to have issues, please contact support or ask the person who invited you to resend the invitation.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            ARIS
          </CardTitle>
          <CardDescription>
            Accept your invitation and set up your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    }>
      <InvitationAcceptContent />
    </Suspense>
  );
}
