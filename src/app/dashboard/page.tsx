'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Users, BarChart3, Sparkles, Building2, ShoppingBag, Activity, ChevronRight, Plus } from "lucide-react";
import { 
  ArisAnimatedCard, 
  ArisAnimatedStats, 
  ArisAnimatedButton, 
  ArisPageTransition, 
  ArisAnimatedList,
  ArisFloatingButton,
  fadeInUp,
  staggerContainer,
  staggerItem
} from '@/components/ui/aris-animations';
import { motion } from 'framer-motion';

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
  delay?: number;
}

interface FeatureCardPropsWithRef extends Omit<FeatureCardProps, 'onRef'> {
  onRef?: (el: HTMLDivElement | null) => void;
}

const AnimatedFeatureCard = ({ 
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
  delay = 0,
  onRef
}: FeatureCardPropsWithRef) => {
  if (disabled) {
    return (
      <ArisAnimatedCard delay={delay} hover={false} className="h-full border border-gray-100/50 bg-white/40 backdrop-blur-sm shadow-sm">
        <div className="absolute top-3 right-3 z-20">
          <motion.span 
            className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-200/50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            Coming Soon
          </motion.span>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col h-full">
            <div className="flex items-start">
              <motion.div 
                className={`p-3 rounded-lg ${iconBg} flex-shrink-0`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
              >
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </motion.div>
              <div className="ml-4 flex-1">
                <motion.h3 
                  className="text-lg font-semibold text-gray-900 mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 }}
                >
                  {title}
                </motion.h3>
                <motion.p 
                  className="text-sm text-gray-600 leading-relaxed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.2 }}
                >
                  {description}
                </motion.p>
              </div>
            </div>
          </div>
        </CardContent>
      </ArisAnimatedCard>
    );
  }

  return (
    <Link href={href} className="block h-full group">
      <ArisAnimatedCard 
        delay={delay} 
        className="h-full border border-gray-100/50 bg-white/40 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden hover:border-transparent hover:ring-1 hover:ring-blue-200/50"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5`} />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col h-full">
            <div className="flex items-start">
              <motion.div 
                className={`p-3 rounded-lg ${iconBg} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
              >
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </motion.div>
              <div className="ml-4 flex-1">
                <motion.h3 
                  className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 }}
                >
                  {title}
                </motion.h3>
                <motion.p 
                  className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.2 }}
                >
                  {description}
                </motion.p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
              >
                <ArisAnimatedButton 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                >
                  Explore
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </ArisAnimatedButton>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </ArisAnimatedCard>
    </Link>
  );
};

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setIsVisible(true);
    // Show floating button after a delay
    const timer = setTimeout(() => setShowFloatingButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddNew = () => {
    // This could open a quick-add modal or navigate to a specific page
    console.log('Quick add action');
  };

  const features = [
    {
      title: "Email Management",
      description: "Centralized email handling with AI-powered insights and automated responses for better customer communication.",
      icon: Mail,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      gradientFrom: "from-blue-500",
      gradientTo: "to-purple-600",
      href: "/dashboard/email"
    },
    {
      title: "Contact Management",
      description: "Comprehensive contact database with personality insights, interaction history, and relationship tracking.",
      icon: Users,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-blue-600",
      href: "/dashboard/contacts"
    },
    {
      title: "Supplier Network",
      description: "Manage your supplier relationships, track performance, and optimize your supply chain operations.",
      icon: Building2,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      gradientFrom: "from-purple-500",
      gradientTo: "to-pink-600",
      href: "/dashboard/suppliers"
    },
    {
      title: "Product Catalog",
      description: "Organize your product inventory with detailed specifications, pricing, and availability tracking.",
      icon: ShoppingBag,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      gradientFrom: "from-orange-500",
      gradientTo: "to-red-600",
      href: "/dashboard/products"
    },
    {
      title: "Order Management",
      description: "Streamline your order processing with automated workflows and real-time status tracking.",
      icon: Activity,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      gradientFrom: "from-cyan-500",
      gradientTo: "to-blue-600",
      href: "/dashboard/orders"
    },
    {
      title: "Analytics & Insights",
      description: "Powerful analytics dashboard with AI-driven insights to optimize your business performance.",
      icon: BarChart3,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-600",
      gradientFrom: "from-pink-500",
      gradientTo: "to-purple-600",
      href: "/dashboard/analytics",
      disabled: true,
      comingSoon: true
    }
  ];

  const stats = [
    { title: "Total Contacts", value: 1847, previousValue: 1820, trend: "up", trendValue: 1.5, prefix: "" },
    { title: "Active Orders", value: 247, previousValue: 230, trend: "up", trendValue: 7.4, prefix: "" },
    { title: "Monthly Revenue", value: 47392, previousValue: 43200, trend: "up", trendValue: 9.7, prefix: "$" },
    { title: "Supplier Partners", value: 156, previousValue: 150, trend: "up", trendValue: 4.0, prefix: "" }
  ];

  return (
    <ArisPageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            className="mb-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.h1 
                  className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  ARIS CRM Dashboard
                </motion.h1>
                <motion.p 
                  className="text-gray-600 mt-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Manage your business relationships with AI-powered insights
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <ArisAnimatedButton>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Insights
                </ArisAnimatedButton>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {stats.map((stat, index) => (
              <motion.div key={stat.title} variants={staggerItem}>
                <ArisAnimatedStats
                  title={stat.title}
                  value={stat.value}
                  previousValue={stat.previousValue}
                  trend={stat.trend as any}
                  trendValue={stat.trendValue}
                  prefix={stat.prefix}
                  delay={index * 0.1}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Core Features</h2>
            <ArisAnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <AnimatedFeatureCard
                  key={feature.title}
                  {...feature}
                  delay={index * 0.1}
                  onRef={(el) => cardRefs.current[index] = el}
                />
              ))}
            </ArisAnimatedList>
          </motion.div>

          {/* Recent Activity Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <ArisAnimatedCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <ArisAnimatedButton variant="outline" size="sm">
                  View All
                </ArisAnimatedButton>
              </div>
              <div className="space-y-3">
                {[
                  { action: "New contact added", time: "2 minutes ago", type: "contact" },
                  { action: "Order #1234 completed", time: "15 minutes ago", type: "order" },
                  { action: "Supplier contract renewed", time: "1 hour ago", type: "supplier" }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <span className="text-sm text-gray-900">{activity.action}</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </ArisAnimatedCard>
          </motion.div>
        </div>

        {/* Floating Action Button */}
        {showFloatingButton && (
          <ArisFloatingButton
            onClick={handleAddNew}
            icon={<Plus className="h-6 w-6" />}
            label="Quick Add"
          />
        )}
      </div>
    </ArisPageTransition>
  );
}
