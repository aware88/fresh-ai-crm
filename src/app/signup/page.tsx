import SignUpForm from '@/components/auth/SignUpForm';
import Link from 'next/link';

export const metadata = {
  title: 'Sign Up | ARIS',
  description: 'Join the ARIS platform',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Brand/Logo */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-pink-500/20 to-blue-500/20 blur-xl"></div>
        
        {/* Content */}
        <div className="max-w-md mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black mb-6">ARIS</h1>
          <p className="text-xl md:text-2xl mb-10">Your CRM didn't evolve. So we built the one that did.</p>
          <div className="space-y-8 text-left">
            <div className="flex items-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 mr-4 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-medium">AI-powered email analysis</span>
            </div>
            <div className="flex items-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 mr-4 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-medium">Smart contact management</span>
            </div>
            <div className="flex items-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 mr-4 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-medium">Seamless integrations</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Sign Up Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 via-white to-blue-50">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ARIS</h1>
            </Link>
            <p className="mt-2 text-gray-600">Create your account to get started</p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
