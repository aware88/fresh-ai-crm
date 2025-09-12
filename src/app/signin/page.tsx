import SignInForm from '@/components/auth/SignInForm';
import { Ripple, ARISOrbitDisplay } from '@/components/ui/modern-animated-sign-in';

export const metadata = {
  title: 'Sign In | ARIS',
  description: 'Sign in to your ARIS account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - ARIS Animation */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative bg-white">
        <Ripple mainCircleSize={120} numCircles={8} />
        <ARISOrbitDisplay text="ARIS" />
      </div>
      
      {/* Right side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  );
}
