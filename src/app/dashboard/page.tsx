'use client';

import { useState, useEffect, ReactNode } from 'react';
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

// Types
interface DashboardCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color?: string;
  disabled?: boolean;
  className?: string;
  featureKey?: string;
  requiredPlan?: string;
  index?: number;
}

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

const DashboardCard = ({
  title,
  description,
  icon,
  href,
  color = 'blue',
  disabled = false,
  className = '',
  featureKey,
  requiredPlan = 'Pro',
  index = 0
}: DashboardCardProps) => {
  const { data: session } = useSession();
  const organizationId = (session?.user as any)?.organizationId || "";
  const { hasFeature, plan, isActive } = useSubscriptionFeatures(organizationId);
  const { toast } = useToast();
  const router = useRouter();
  
  // Check if feature is available based on subscription
  const isFeatureAvailable = !featureKey || hasFeature(featureKey, true);
  const isPremium = featureKey && !isFeatureAvailable && !disabled;
  const colorVariants = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const colorClass = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  const handlePremiumClick = (e: React.MouseEvent) => {
    if (isPremium) {
      e.preventDefault();
      toast({
        title: "Premium Feature",
        description: `This feature requires the ${requiredPlan} plan. Upgrade your subscription to access it.`,
        variant: "default",
      });
      router.push("/settings/subscription");
    }
  };

  const cardContent = (
    <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm ${isPremium ? 'border-amber-400/50' : ''} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${colorClass} text-white relative`}>
            {icon}
            {isPremium && (
              <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-0.5">
                <Crown className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>
          {isPremium && (
            <Badge variant="outline" className="border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <Crown className="h-3 w-3 mr-1" /> Premium
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-foreground/70">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {disabled ? 'Coming soon' : isPremium ? 'Upgrade' : 'Open'}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full h-8 w-8 p-0 group"
            disabled={disabled}
          >
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            <span className="sr-only">Open {title}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return (
      <motion.div 
        variants={item}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          delay: index * 0.05
        }}
        className="relative h-full"
      >
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
        {cardContent}
      </motion.div>
    );
  }
  
  if (isPremium) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <motion.div 
              variants={item}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                delay: index * 0.05
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="h-full"
              onClick={handlePremiumClick}
            >
              <div className="h-full cursor-pointer">
                {cardContent}
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="flex flex-col gap-1">
              <p className="font-medium">Premium Feature</p>
              <p className="text-xs text-muted-foreground">Upgrade to {requiredPlan} plan to unlock this feature</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div 
      variants={item}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: index * 0.05
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={href} className="h-full block">
        {cardContent}
      </Link>
    </motion.div>
  );
};

// Feature Card Component with animation references
interface FeatureCardProps {
  title: string;
  description: string;
  icon: any;
  iconBg?: string;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  href: string;
  onRef?: (el: HTMLElement | null) => void;
  featureKey?: string;
  requiredPlan?: string;
  disabled?: boolean;
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
  onRef,
  featureKey,
  requiredPlan = 'Pro',
  disabled = false
}: FeatureCardProps) => {
  const { data: session } = useSession();
  const organizationId = (session?.user as any)?.organizationId || "";
  const { hasFeature, plan } = useSubscriptionFeatures(organizationId);
  const { toast } = useToast();
  const router = useRouter();
  
  // Check if feature is available based on subscription
  const isFeatureAvailable = !featureKey || hasFeature(featureKey, true);
  const isPremium = featureKey && !isFeatureAvailable && !disabled;
  
  const handlePremiumClick = (e: React.MouseEvent) => {
    if (isPremium) {
      e.preventDefault();
      e.stopPropagation();
      toast({
        title: "Premium Feature",
        description: `This feature requires the ${requiredPlan} plan. Upgrade your subscription to access it.`,
        variant: "default",
      });
      router.push("/settings/subscription");
    }
  };
  if (disabled) {
    return (
      <motion.div
        ref={onRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 dark:bg-gray-950 dark:border-gray-800"
      >
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
            Coming Soon
          </span>
        </div>
        <div className="block p-6">
          <div className="flex items-center justify-between">
            <div className={`rounded-lg ${iconBg || 'bg-blue-100'} p-2 ${iconColor || 'text-blue-600'}`}>
              <Icon className="h-6 w-6" />
            </div>
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  if (isPremium) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <motion.div
              ref={onRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-gray-950 dark:border-gray-800 border-amber-400/30"
              onClick={handlePremiumClick}
            >
              <div className="block p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <h3 className="font-medium">{title}</h3>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
                    <span className="flex items-center space-x-1">
                      <Crown className="h-3 w-3" />
                      <span>Premium</span>
                    </span>
                  </Badge>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">{title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <div 
                  className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
                  style={{
                    background: `linear-gradient(45deg, #f59e0b, #f97316)`
                  }}
                />
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="flex flex-col gap-1">
              <p className="font-medium">Premium Feature</p>
              <p className="text-xs text-muted-foreground">Upgrade to {requiredPlan} plan to unlock this feature</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <motion.div
      ref={onRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-gray-950 dark:border-gray-800"
    >
      <Link href={href} className="block p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg ${iconBg || 'bg-blue-100'} p-2 ${iconColor || 'text-blue-600'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <svg
            className="h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1 dark:text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div 
          className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
          style={{
            background: gradientFrom && gradientTo ? 
              `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})` : 
              'linear-gradient(45deg, #3b82f6, #8b5cf6)'
          }}
        />
      </Link>
    </motion.div>
  );
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
                    <p>Click to manage your subscription</p>
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
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={container}
      >
        {stats.map((stat) => (
          <motion.div 
            key={stat.name}
            variants={item}
            className="p-4 bg-card rounded-xl border shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                stat.changeType === 'positive' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {stat.change}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <DashboardCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            href={feature.href}
            color={feature.color}
            disabled={feature.disabled}
            featureKey={feature.featureKey}
            requiredPlan={feature.requiredPlan}
            index={index}
          />
        ))}
      </div>

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
