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
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

// Types for dashboard data
interface DashboardStat {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface RecentActivity {
  id: string;
  type: 'email' | 'order' | 'ai_agent' | 'interaction' | 'task';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

// Helper function to get time ago string
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

// Helper function to get icon component
function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    Mail,
    CheckCircle,
    AlertCircle,
    Brain,
    Users,
    Package,
    MessageSquare: MessageSquareText,
    Activity
  };
  return iconMap[iconName] || Activity;
}

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
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const statsData = await response.json();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
      // Fallback to mock data
      setStats([
        { name: 'Unread Emails', value: '0', change: '0%', changeType: 'neutral' },
        { name: 'Upcoming Tasks', value: '0', change: '0%', changeType: 'neutral' },
        { name: 'New Messages', value: '0', change: '0%', changeType: 'neutral' },
        { name: 'Completed Orders', value: '0', change: '0%', changeType: 'neutral' },
      ]);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    setIsLoadingActivities(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard/activities');
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities');
      }
      
      const activitiesData = await response.json();
      setRecentActivities(activitiesData);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError('Failed to load recent activities');
      // Fallback to empty array
      setRecentActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (session) {
      fetchDashboardStats();
      fetchRecentActivities();
    }
  }, [session]);

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
          {isLoadingStats ? (
            // Loading skeleton for stats
            [1, 2, 3, 4].map((i) => (
              <motion.div key={i} variants={item}>
                <Card className="hover:shadow-lg transition-shadow duration-200 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-gray-300 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            stats.map((stat, index) => (
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
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {stat.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
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
              {isLoadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 animate-pulse">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const IconComponent = getIconComponent(activity.icon);
                    const colorClasses = {
                      blue: 'bg-blue-50 border-blue-200 text-blue-600',
                      green: 'bg-green-50 border-green-200 text-green-600',
                      purple: 'bg-purple-50 border-purple-200 text-purple-600',
                      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
                      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
                      teal: 'bg-teal-50 border-teal-200 text-teal-600',
                      gray: 'bg-gray-50 border-gray-200 text-gray-600',
                    };
                    
                    const colorClass = colorClasses[activity.color as keyof typeof colorClasses] || colorClasses.gray;
                    
                    return (
                      <div key={activity.id} className={`flex items-center gap-3 p-3 rounded-lg border ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                        <IconComponent className={`w-5 h-5 ${colorClass.split(' ')[2]}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No recent activity</p>
                  <p className="text-sm text-gray-400">Your activities will appear here when you start using the system</p>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      fetchDashboardStats();
                      fetchRecentActivities();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
