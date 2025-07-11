import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';

export const metadata = {
  title: 'Sign In | ARIS',
  description: 'Sign in to your ARIS account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Brand/Logo */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">ARIS</h1>
          <p className="text-xl mb-8">Your intelligent CRM solution powered by AI</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>AI-powered email analysis</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Smart contact management</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Seamless integrations</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Sign In Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">ARIS</h1>
            </Link>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
          </div>
          <div className="bg-card rounded-lg shadow-sm border p-8">
            <SignInForm />
          </div>
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
