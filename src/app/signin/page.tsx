import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';

export const metadata = {
  title: 'Sign In | AI CRM',
  description: 'Sign in to your AI CRM account',
};

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 w-full">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-bold">AI CRM</h1>
        </Link>
      </div>
      <div className="w-full max-w-md mx-auto px-4">
        <SignInForm />
      </div>
    </div>
  );
}
