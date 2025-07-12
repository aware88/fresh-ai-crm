'use client';

import { useState, useEffect, ReactNode, Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSubscriptionFeatures } from "@/hooks/useSubscriptionFeatures";
import { cn } from "@/lib/utils";
import { 
  Mail, 
  Users, 
  BarChart3, 
  Sparkles, 
  ShoppingBag, 
  MessageSquareText,
  Calendar,
  FileText,
  Search,
  Plus,
  ArrowRight,
  Package,
  Zap,
  Crown,
  Activity,
  Lock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Dynamic imports for code splitting
const DashboardCard = lazy(() => import('./components/DashboardCard'));
const FeatureCard = lazy(() => import('./components/FeatureCard'));
const StatsCards = lazy(() => import('./components/StatsCards'));
const FeaturesGrid = lazy(() => import('./components/FeaturesGrid'));

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

// Main Dashboard Component
export default function DashboardPage() {
  // Animation refs for staggered animations
  const [refs, setRefs] = useState<Array<HTMLElement | null>>([]);
  const { data: session } = useSession();
  // Use organization ID from session with proper type checking
  const organizationId = (session?.user as any)?.organizationId || "";
  const { plan, isActive, hasFeature } = useSubscriptionFeatures(organizationId);
  const { toast } = useToast();
  const router = useRouter();
  
  // Animation state for interactive elements
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const addToRefs = (el: HTMLElement | null) => {
    if (el && !refs.includes(el)) {
      setRefs(prev => [...prev, el]);
    }
  };
  
  // Function to check if user has access to a feature
  const checkFeatureAccess = (featureKey: string) => {
    return !featureKey || hasFeature(featureKey, true);
  };
  const stats = [
    { name: 'Unread Emails', value: '12', change: '+2.5%', changeType: 'positive' as const },
    { name: 'Upcoming Tasks', value: '5', change: '+1', changeType: 'negative' as const },
    { name: 'New Messages', value: '8', change: '+3', changeType: 'positive' as const },
    { name: 'Completed Orders', value: '24', change: '+12%', changeType: 'positive' as const },
  ];

  const features = [
    {
      title: 'Emails',
      description: 'Manage your email communications',
      icon: <Mail className="h-6 w-6" />,
      href: '/dashboard/email',
      color: 'blue',
      featureKey: 'EMAIL_MANAGEMENT'
    },
    {
      title: 'Email Analyser',
      description: 'AI-powered email analysis',
      icon: <Zap className="h-6 w-6" />,
      href: '/dashboard/email-analyser',
      color: 'amber',
      featureKey: 'ADVANCED_EMAIL_ANALYSIS',
      requiredPlan: 'Pro'
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered assistance',
      icon: <Sparkles className="h-6 w-6" />,
      href: '/dashboard/assistant',
      color: 'purple',
      featureKey: 'AI_ASSISTANT'
    },
    {
      title: 'Contacts',
      description: 'Manage your business contacts',
      icon: <Users className="h-6 w-6" />,
      href: '/dashboard/contacts',
      color: 'green'
    },
    {
      title: 'Orders',
      description: 'Track and manage orders',
      icon: <ShoppingBag className="h-6 w-6" />,
      href: '/dashboard/orders',
      color: 'yellow',
      featureKey: 'ORDER_MANAGEMENT'
    },
    {
      title: 'Products',
      description: 'Manage your product catalog',
      icon: <Package className="h-6 w-6" />,
      href: '/dashboard/products',
      color: 'pink',
      featureKey: 'PRODUCT_MANAGEMENT'
    },
    {
      title: 'Analytics',
      description: 'View business analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/dashboard/analytics',
      color: 'indigo',
      featureKey: 'ADVANCED_ANALYTICS',
      requiredPlan: 'Business'
    },
    {
      title: 'Sales Documents',
      description: 'Manage quotes and invoices',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/sales-documents',
      color: 'cyan',
      featureKey: 'SALES_DOCUMENTS'
    },
    {
      title: 'Messages',
      description: 'Manage customer messages',
      icon: <MessageSquareText className="h-6 w-6" />,
      href: '/dashboard/messages',
      color: 'blue',
      disabled: true
    },
    {
      title: 'Calendar',
      description: 'Schedule and manage events',
      icon: <Calendar className="h-6 w-6" />,
      href: '/dashboard/calendar',
      color: 'purple',
      disabled: true
    }
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your business.
            </p>
            {plan && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={isActive ? "default" : "outline"} 
                      className={cn(
                        "ml-2 cursor-pointer", 
                        plan.id === 'free' ? "bg-gray-500" : 
                        plan.id === 'starter' ? "bg-blue-500" : 
                        plan.id === 'pro' || plan.id === 'pro-beta' ? "bg-purple-500" : 
                        plan.id === 'business' ? "bg-amber-500" : 
                        "bg-green-500"
                      )}
                      onClick={() => router.push("/settings/subscription")}
                    >
                      <div className="flex items-center">
                        <Crown className="h-3 w-3 mr-1" /> 
                        {plan.name} Plan
                      </div>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage your subscription</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-full md:w-[300px]" 
            />
          </div>
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 h-24 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted/20 rounded-xl"></div>
        ))}
      </div>}>
        <StatsCards stats={stats} />
      </Suspense>

      {/* Features Grid */}
      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-48">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted/20 animate-pulse rounded-xl"></div>
        ))}
      </div>}>
        <FeaturesGrid features={features} />
      </Suspense>

      {/* Recent Activity */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">New message from John Doe</p>
                    <span className="text-sm text-muted-foreground">2h ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hey, just wanted to follow up on our conversation from yesterday...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
