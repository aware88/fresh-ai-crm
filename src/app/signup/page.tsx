'use client';

import SignUpForm from '@/components/auth/SignUpForm';
import { Ripple, ARISOrbitDisplay } from '@/components/ui/modern-animated-sign-in';
import Image from 'next/image';

// Enhanced ARIS-themed orbiting icons for sign-up page
const arisIconsArray = [
  {
    component: () => (
      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl border border-cyan-200/50">
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    className: 'size-[80px] border-none bg-transparent',
    duration: 30,
    delay: 0,
    radius: 140,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <div className="w-12 h-12 bg-gradient-to-br from-[var(--aris-blue)] to-blue-600 rounded-2xl flex items-center justify-center shadow-xl border border-blue-200/50">
        <span className="text-white text-2xl font-black tracking-tight">A</span>
      </div>
    ),
    className: 'size-[48px] border-none bg-transparent',
    duration: 25,
    delay: 12,
    radius: 100,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg border border-emerald-200/50">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    className: 'size-[40px] border-none bg-transparent',
    duration: 35,
    delay: 18,
    radius: 180,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-violet-200/50">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    className: 'size-[32px] border-none bg-transparent',
    duration: 28,
    delay: 8,
    radius: 220,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl border border-orange-200/50">
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    className: 'size-[56px] border-none bg-transparent',
    duration: 40,
    delay: 5,
    radius: 260,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg border border-pink-200/50">
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    className: 'size-[24px] border-none bg-transparent',
    duration: 45,
    delay: 22,
    radius: 300,
    path: false,
    reverse: true,
  },
];

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - ARIS Animation */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative bg-white">
        <Ripple mainCircleSize={120} numCircles={8} />
        <ARISOrbitDisplay iconsArray={arisIconsArray} text="ARIS" />
      </div>
      
      {/* Right side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
