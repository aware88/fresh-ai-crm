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
  AlertCircle,
  Building2,
  ChevronRight,
  Brain
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

  const quickActions = [
    { 
      name: 'Email Analysis', 
      href: '/dashboard/email-analyser', 
      icon: Mail, 
      description: 'Analyze and respond to emails',
      gradient: 'from-blue-500 to-purple-600',
      featureKey: 'email_analysis'
    },
    { 
      name: 'Contact Management', 
      href: '/dashboard/contacts', 
      icon: Users, 
      description: 'Manage customer relationships',
      gradient: 'from-green-500 to-blue-600',
      featureKey: 'contact_management'
    },
    { 
      name: 'Analytics', 
      href: '/dashboard/analytics', 
      icon: BarChart3, 
      description: 'View performance metrics',
      gradient: 'from-purple-500 to-pink-600',
      featureKey: 'analytics'
    },
    { 
      name: 'AI Agents', 
      href: '/dashboard/agents', 
      icon: Brain, 
      description: 'Manage AI agents',
      gradient: 'from-orange-500 to-red-600',
      featureKey: 'ai_agents'
    },
    { 
      name: 'Products', 
      href: '/dashboard/products', 
      icon: Package, 
      description: 'Manage your inventory',
      gradient: 'from-teal-500 to-green-600',
      featureKey: 'product_management'
    },
    { 
      name: 'Orders', 
      href: '/dashboard/orders', 
      icon: ShoppingBag, 
      description: 'Track and manage orders',
      gradient: 'from-indigo-500 to-blue-600',
      featureKey: 'order_management'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome back!
              </h1>
              <p className="text-gray-600 mt-2">
                Here's what's happening with your business today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">
                {plan?.name || 'Free'} Plan
              </Badge>
              <Button 
                onClick={() => router.push('/dashboard/agents')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Agents
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.name} variants={item}>
              <Card className="hover:shadow-lg transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stat.change}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={action.href}>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "p-3 rounded-lg bg-gradient-to-r",
                          action.gradient
                        )}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        {!checkFeatureAccess(action.featureKey) && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.name}</h3>
                      <p className="text-gray-600 text-sm">{action.description}</p>
                      <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-purple-600 transition-colors">
                        Get started
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest business activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New email from customer</p>
                    <p className="text-xs text-gray-600">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Order completed successfully</p>
                    <p className="text-xs text-gray-600">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">AI agent processed 5 emails</p>
                    <p className="text-xs text-gray-600">30 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
