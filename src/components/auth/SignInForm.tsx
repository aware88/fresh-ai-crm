'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AnimatedForm,
  BoxReveal
} from '@/components/ui/modern-animated-sign-in';

export default function SignInForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    name: keyof typeof formData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResendConfirmation(false);
    setResendSuccess(false);

    try {
      console.log('🔐 Attempting sign in for:', formData.email);
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
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
        body: JSON.stringify({ email: formData.email }),
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

  const goToForgotPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    window.location.href = '/forgot-password';
  };

  const formFields = {
    header: 'Welcome back to ARIS',
    subHeader: 'Sign in to your Agentic Relationship Intelligence System',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'Enter your email address',
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password' as const,
        placeholder: 'Enter your password',
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: loading ? 'Signing in...' : 'Sign in to ARIS',
    textVariantButton: 'Forgot your password?',
  };

  return (
    <div className="w-full">
      {/* Error Messages */}
      {error && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </BoxReveal>
      )}

      {showResendConfirmation && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className="mb-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>Your email address needs to be confirmed.</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline justify-start"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend confirmation email'
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </BoxReveal>
      )}

      {resendSuccess && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className="mb-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Confirmation email sent! Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>
        </BoxReveal>
      )}

      {/* Animated Form */}
      <AnimatedForm
        {...formFields}
        fieldPerRow={1}
        onSubmit={handleSubmit}
        goTo={goToForgotPassword}
        googleLogin="Continue with Google"
        microsoftLogin="Continue with Microsoft"
      />

      {/* Additional Links */}
      <div className="mt-6 space-y-4">
        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <div className="text-center text-sm">
            <Link 
              href="/auth/resend-confirmation" 
              className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              Need to confirm your email?
            </Link>
          </div>
        </BoxReveal>

        <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </BoxReveal>
      </div>
    </div>
  );
}
