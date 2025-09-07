'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
        // Pass rememberMe to extend session if checked
        ...(rememberMe && { callbackUrl: '/dashboard?remember=true' })
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
    <Card className="w-full border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showResendConfirmation && (
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
        )}

        {resendSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Confirmation email sent! Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={loading}
            />
            <Label 
              htmlFor="remember" 
              className="text-sm font-normal cursor-pointer"
            >
              Remember me for 30 days
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[var(--aris-blue)] via-[var(--aris-purple)] to-[var(--aris-pink)] hover:opacity-90 text-white font-medium shadow-lg transition-all duration-200" 
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            type="button"
            disabled={loading}
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <Button 
            variant="outline" 
            type="button"
            disabled={true}
            title="Microsoft login coming soon"
            className="opacity-50 cursor-not-allowed"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#f25022" d="M1 1h10v10H1z"/>
              <path fill="#00a4ef" d="M13 1h10v10H13z"/>
              <path fill="#7fba00" d="M1 13h10v10H1z"/>
              <path fill="#ffb900" d="M13 13h10v10H13z"/>
            </svg>
            Microsoft
          </Button>
        </div>

        <div className="text-center text-sm">
          <Link 
            href="/auth/resend-confirmation" 
            className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Need to confirm your email?
          </Link>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
