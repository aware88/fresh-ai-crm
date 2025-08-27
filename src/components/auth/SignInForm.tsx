'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResendConfirmation(false);
    setResendSuccess(false);

    try {
      console.log('🔐 Attempting sign in for:', email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('🔐 Sign in result:', result);

      if (result?.error) {
        console.error('🔐 Sign in error:', result.error);
        setError(result.error);
        
        // Check if error is related to email confirmation - be more comprehensive
        if (result.error.includes('confirmation link') || 
            result.error.includes('Email not confirmed') ||
            result.error.includes('not yet confirmed') ||
            result.error.includes('confirm your email') ||
            result.error.includes('email confirmation')) {
          setShowResendConfirmation(true);
        }
      } else if (result?.ok) {
        console.log('✅ Sign in successful, redirecting to dashboard...');
        // Manual redirect since NextAuth redirect isn't working
        window.location.href = '/dashboard';
      } else {
        console.warn('🔐 Unexpected sign in result:', result);
        setError('Sign in failed - please try again');
      }
    } catch (error) {
      console.error('🔐 Sign in exception:', error);
      setError('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setShowResendConfirmation(false);
      } else {
        setError(data.error || 'Failed to resend confirmation email');
      }
    } catch (error) {
      setError('An error occurred while resending confirmation email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-8 pb-4">
        <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
        <p className="text-gray-600 text-base mt-1">Enter your email and password to access your account</p>
      </div>
      <div className="p-8 pt-4">
        {error && (
          <Alert variant="destructive" className="mb-6 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showResendConfirmation && (
          <Alert className="mb-6 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Need to confirm your email? 
              <Button 
                variant="link" 
                className="p-0 ml-1 h-auto font-normal underline"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend confirmation email'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert className="mb-6 rounded-xl">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Confirmation email sent! Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl py-6 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 text-base font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" 
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="text-center mt-4 space-y-2">
          <div>
            <Link 
              href="/forgot-password" 
              className="text-sm text-gray-600 hover:text-purple-600 font-medium hover:underline transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
          <div>
            <Link 
              href="/auth/resend-confirmation" 
              className="text-sm text-gray-600 hover:text-purple-600 font-medium hover:underline transition-colors"
            >
              Need to resend confirmation email?
            </Link>
          </div>
        </div>
      </div>
      <div className="p-8 pt-2">
        <p className="text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-purple-600 font-medium hover:underline transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
