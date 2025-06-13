import SignUpForm from '@/components/auth/SignUpForm';
import Link from 'next/link';

export const metadata = {
  title: 'Sign Up | CRM MIND',
  description: 'Join the CRM MIND beta program',
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 w-full">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-bold">CRM MIND</h1>
        </Link>
      </div>
      <div className="w-full max-w-md mx-auto px-4">
        <SignUpForm />
      </div>
    </div>
  );
}
