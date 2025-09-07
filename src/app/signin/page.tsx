import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';
import { Sparkles, Zap, Shield } from 'lucide-react';

export const metadata = {
  title: 'Sign In | ARIS',
  description: 'Sign in to your ARIS account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Brand/Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--aris-blue)] via-[var(--aris-purple)] to-[var(--aris-pink)] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-tl from-white/10 to-transparent blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-radial from-white/5 to-transparent blur-2xl animate-pulse animation-delay-4000"></div>
        </div>
        
        {/* Content */}
        <div className="max-w-lg mx-auto relative z-10">
          <div className="mb-12">
            <div className="relative mb-6 animate-float">
              {/* Multi-layer glow effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-64 h-64 bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-glow-pulse"></div>
                <div className="absolute w-48 h-48 bg-gradient-to-r from-blue-400/20 via-violet-400/20 to-fuchsia-400/20 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
              </div>
              
              {/* Main ARIS title with animated gradient */}
              <h1 className="relative text-7xl lg:text-8xl font-black tracking-tight select-none">
                {/* Base gradient text */}
                <span className="inline-block bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto] drop-shadow-2xl">
                  ARIS
                </span>
                
                {/* Animated color overlay */}
                <span className="absolute inset-0 text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent opacity-60 animate-gradient-shift bg-[length:200%_auto] animation-delay-2000">
                  ARIS
                </span>
                
                {/* Shine effect */}
                <span className="absolute inset-0 text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-r from-transparent via-white/40 to-transparent bg-clip-text text-transparent animate-shine bg-[length:200%_auto]">
                  ARIS
                </span>
              </h1>
              
              {/* Animated decorative particles */}
              <div className="absolute -top-4 left-0 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
              <div className="absolute -top-2 right-4 w-3 h-3 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full animate-pulse animation-delay-2000 shadow-lg shadow-purple-400/50"></div>
              <div className="absolute -bottom-3 left-8 w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse animation-delay-4000 shadow-lg shadow-pink-400/50"></div>
              <div className="absolute bottom-0 -right-4 w-4 h-4 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full animate-pulse shadow-lg shadow-violet-400/50"></div>
              
              {/* Subtle underline accent */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-gradient-shift bg-[length:200%_auto]"></div>
            </div>
            
            <p className="text-xl lg:text-2xl font-medium leading-relaxed text-white/95 drop-shadow-lg">
              Your CRM didn't evolve.<br />So we built the one that did.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start group">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mr-4 shadow-xl group-hover:bg-white/30 transition-all duration-300">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 text-white drop-shadow-md">AI-Powered Intelligence</h3>
                <p className="text-sm text-white/90 leading-relaxed">Automate responses, categorize leads, and predict customer behavior with advanced AI</p>
              </div>
            </div>
            
            <div className="flex items-start group">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mr-4 shadow-xl group-hover:bg-white/30 transition-all duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 text-white drop-shadow-md">Lightning Fast Workflow</h3>
                <p className="text-sm text-white/90 leading-relaxed">Streamline your sales process with smart automation and real-time collaboration</p>
              </div>
            </div>
            
            <div className="flex items-start group">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mr-4 shadow-xl group-hover:bg-white/30 transition-all duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 text-white drop-shadow-md">Enterprise Security</h3>
                <p className="text-sm text-white/90 leading-relaxed">Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA standards</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/30">
            <p className="text-sm text-white/80 font-medium">
              Trusted by over 10,000 businesses worldwide
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30">
        <div className="w-full max-w-md space-y-8">
          {/* Logo for mobile */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-block mb-8">
              <h1 className="text-4xl font-black bg-gradient-to-r from-[var(--aris-blue)] via-[var(--aris-purple)] to-[var(--aris-pink)] bg-clip-text text-transparent">ARIS</h1>
            </Link>
          </div>
          
          {/* Desktop logo */}
          <div className="hidden lg:block text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--aris-blue)] via-[var(--aris-purple)] to-[var(--aris-pink)] blur-xl opacity-50"></div>
                <h1 className="relative text-3xl font-black bg-gradient-to-r from-[var(--aris-blue)] via-[var(--aris-purple)] to-[var(--aris-pink)] bg-clip-text text-transparent">ARIS</h1>
              </div>
            </Link>
          </div>
          
          <SignInForm />
          
          <p className="text-center text-xs text-muted-foreground px-8">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
