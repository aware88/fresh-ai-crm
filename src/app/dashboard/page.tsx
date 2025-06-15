'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users, BarChart3, Sparkles, Building2, ShoppingBag, Activity, ChevronRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  href: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface FeatureCardPropsWithRef extends Omit<FeatureCardProps, 'onRef'> {
  onRef?: (el: HTMLDivElement | null) => void;
}

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  iconBg, 
  iconColor, 
  gradientFrom, 
  gradientTo,
  href,
  disabled = false,
  comingSoon = false,
  onRef
}: FeatureCardPropsWithRef) => {
  if (disabled) {
    return (
      <div className="h-full">
        <Card className="h-full border border-gray-100/50 bg-white/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden hover:border-transparent hover:ring-1 hover:ring-gray-200/50">
          <div className="absolute top-3 right-3 z-20">
            <span className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-200/50">
              Coming Soon
            </span>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              <div className="flex items-start">
                <div className={`p-3 rounded-xl backdrop-blur-sm bg-gradient-to-br from-white/30 to-white/10 ${iconBg.replace('100', '50')} ${iconColor.replace('600', '400')} mb-5 transition-transform duration-300 group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100/50">
                <span className="inline-flex items-center text-sm font-medium text-gray-400">
                  Coming soon
                  <ChevronRight className="ml-1 h-4 w-4" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full group" ref={onRef} data-card-hover>
      <Link 
        href={href}
        className="block h-full no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="h-full border border-gray-100/50 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden hover:border-transparent hover:ring-1 hover:ring-blue-100/50">
          {/* Animated gradient background on hover */}
          <div 
            className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
            style={{ 
              background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${gradientFrom}08 0%, ${gradientTo}08 70%, transparent 150%)`,
              transition: 'opacity 0.5s ease, background 0.3s ease'
            }}
          />
          
          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col h-full">
              <div className="flex items-start">
                <div 
                  className={`p-3 rounded-xl backdrop-blur-sm bg-gradient-to-br from-white/30 to-white/10 ${iconBg} ${iconColor} mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors">{description}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100/50 group-hover:border-gray-200 transition-colors">
                <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                  Get started
                  <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default function DashboardPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardsRef = useRef<HTMLDivElement[]>([]);

  // Handle mouse move for card hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only update if we have cards
      if (cardsRef.current.length === 0) return;
      
      // Find the card under the cursor
      const card = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-card-hover]');
      if (!card) return;
      
      // Get the card's position and dimensions
      const rect = card.getBoundingClientRect();
      
      // Calculate mouse position relative to the card (0-1)
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Update the card's CSS variables
      (card as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
      (card as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
    };
    
    // Add event listener
    window.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Add a card to the refs array
  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const features: FeatureCardProps[] = [
    {
      title: "Email Analyser",
      description: "Analyze customer emails to understand their personality and get AI-suggested responses.",
      icon: Mail,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      gradientFrom: "#3b82f6",
      gradientTo: "#8b5cf6",
      href: "/dashboard/email"
    },
    {
      title: "Suppliers",
      description: "Manage suppliers, upload documents, and get AI-powered insights for better procurement.",
      icon: Building2,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      gradientFrom: "#8b5cf6",
      gradientTo: "#3b82f6",
      href: "/dashboard/suppliers"
    },
    {
      title: "Products",
      description: "Manage your product catalog, inventory, and pricing in one place.",
      icon: ShoppingBag,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      gradientFrom: "#10b981",
      gradientTo: "#3b82f6",
      href: "/dashboard/products"
    },
    {
      title: "Orders",
      description: "Track and manage customer orders, invoices, and fulfillment status.",
      icon: ShoppingBag,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      gradientFrom: "#f59e0b",
      gradientTo: "#ec4899",
      href: "/dashboard/orders"
    },
    {
      title: "Contacts",
      description: "View and manage your customer contacts and their interaction history.",
      icon: Users,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      gradientFrom: "#6366f1",
      gradientTo: "#8b5cf6",
      href: "/dashboard/contacts"
    },
    {
      title: "AI Assistant",
      description: "Get AI-powered assistance for your business needs, from answering questions to generating insights.",
      icon: Sparkles,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      gradientFrom: "#8b5cf6",
      gradientTo: "#3b82f6",
      href: "/dashboard/assistant"
    }
  ];

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-300">CRM Mind</span>
            </h1>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-6">
              Transform your customer relationships with AI-powered insights and tools
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                asChild
                className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 text-sm font-medium shadow-sm cursor-pointer"
              >
                <Link href="/dashboard/assistant" className="cursor-pointer">
                  <Activity className="mr-2 h-4 w-4 inline" />
                  Try AI Assistant
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                className="bg-transparent border-white/20 text-white hover:bg-white/10 px-5 py-2.5 text-sm font-medium cursor-pointer"
              >
                <Link href="/dashboard/contacts" className="cursor-pointer">
                  View Contacts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              {...feature} 
              onRef={addToRefs}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
