'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CustomButtonProps {
  variant?: 'solid' | 'outline' | 'ghost';
  colorScheme?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const CustomButton = ({ 
  variant = 'solid', 
  colorScheme = 'blue', 
  size = 'md', 
  className = '', 
  children, 
  onClick 
}: CustomButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    solid: `bg-${colorScheme}-600 text-white hover:bg-${colorScheme}-700 focus:ring-${colorScheme}-500`,
    outline: `border border-${colorScheme}-600 text-${colorScheme}-600 hover:bg-${colorScheme}-50 focus:ring-${colorScheme}-500`,
    ghost: `text-${colorScheme}-600 hover:bg-${colorScheme}-50 focus:ring-${colorScheme}-500`
  };
  
  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                CRM MIND
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features">
                <CustomButton variant="ghost" colorScheme="blue">Features</CustomButton>
              </Link>
              <Link href="#science">
                <CustomButton variant="ghost" colorScheme="blue">Science</CustomButton>
              </Link>
              <Link href="#benefits">
                <CustomButton variant="ghost" colorScheme="blue">Benefits</CustomButton>
              </Link>
              <Link href="/dashboard">
                <CustomButton variant="outline" className="text-blue-600 hover:text-blue-800 border-blue-600">Dashboard</CustomButton>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full p-3">
                <span className="text-white text-2xl">🧠</span>
              </div>
            </div>
            <p className="text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
              AI-Powered CRM Platform
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Transform Your Business with <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI Intelligence</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
              Revolutionize your customer relationships with our cutting-edge AI-powered CRM platform. 
              Automate workflows, predict customer behavior, and drive unprecedented growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/dashboard">
                <CustomButton size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg">
                  Get Started Free
                </CustomButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover how our AI-powered features can transform your business operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Insights",
                description: "Get intelligent recommendations and predictions to optimize your sales process"
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description: "Deep dive into your data with comprehensive reporting and visualization tools"
              },
              {
                icon: "🔄",
                title: "Workflow Automation",
                description: "Automate repetitive tasks and focus on what matters most - your customers"
              },
              {
                icon: "📱",
                title: "Mobile Ready",
                description: "Access your CRM anywhere, anytime with our responsive mobile interface"
              },
              {
                icon: "🔒",
                title: "Enterprise Security",
                description: "Bank-level security with end-to-end encryption and compliance standards"
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Optimized performance ensures your team can work efficiently without delays"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-white text-xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using CRM MIND to drive growth and success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <CustomButton 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Your Free Trial
              </CustomButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                  <path d="M12 12v4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <p className="font-bold text-lg">CRM MIND</p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Features
              </Link>
              <Link href="#science" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Science
              </Link>
              <Link href="#benefits" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Benefits
              </Link>
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              &copy; {new Date().getFullYear()} CRM MIND. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
