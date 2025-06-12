'use client';

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Users, BarChart3, Sparkles, Building2, ShoppingBag, Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  comingSoon = false
}: FeatureCardProps) => {
  if (disabled) {
    return (
      <div className="h-full">
        <Card className="h-full border border-gray-100 bg-white/60 shadow-sm">
          <div className="absolute top-2 right-2 z-20">
            <span className="bg-white/95 px-2 py-0.5 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-200">
              Coming Soon
            </span>
          </div>
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className={`p-3 rounded-xl ${iconBg.replace('100', '50')} ${iconColor.replace('600', '400')} mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">{title}</h3>
            <p className="text-gray-400/80 text-sm">{description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-gray-400/70">
              Coming Soon
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full group">
      <Link 
        href={href}
        className="block h-full no-underline group"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="h-full border border-gray-100 bg-white shadow-sm transition-all duration-300 overflow-hidden hover:shadow-md group-hover:border-transparent group-hover:ring-2 group-hover:ring-opacity-50 group-hover:ring-blue-500">
          <div 
            className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
            style={{ background: `linear-gradient(135deg, ${gradientFrom}10 0%, ${gradientTo}10 100%)` }} 
          />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start">
              <div className={`p-3 rounded-xl ${iconBg} ${iconColor} mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
              Get started
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default function DashboardPage() {
  // Removed handlePageClick as it's now handled in the layout

  const features: FeatureCardProps[] = [
    {
      title: "Email Analysis",
      description: "Analyze customer emails to understand their personality and get AI-suggested responses.",
      icon: Mail,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      gradientFrom: "#3b82f6",
      gradientTo: "#8b5cf6",
      href: "/dashboard/email"
    },
    {
      title: "Supplier Management",
      description: "Manage suppliers, upload documents, and get AI-powered insights for better procurement.",
      icon: Building2,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      gradientFrom: "#8b5cf6",
      gradientTo: "#3b82f6",
      href: "/dashboard/suppliers"
    },
    {
      title: "AI Assistant",
      description: "Get AI-powered assistance for your business needs, from answering questions to generating insights.",
      icon: Sparkles,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      gradientFrom: "#10b981",
      gradientTo: "#3b82f6",
      href: "/dashboard/assistant"
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
      title: "Orders",
      description: "Track and manage customer orders, invoices, and fulfillment status.",
      icon: ShoppingBag,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      gradientFrom: "#f59e0b",
      gradientTo: "#ec4899",
      href: "/dashboard/sales/orders"
    },
    {
      title: "Analytics",
      description: "Track and analyze customer engagement metrics with AI-driven insights.",
      icon: BarChart3,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      gradientFrom: "#6b7280",
      gradientTo: "#1f2937",
      href: "#",
      disabled: true,
      comingSoon: true
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
            <div key={index} className="h-full">
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
