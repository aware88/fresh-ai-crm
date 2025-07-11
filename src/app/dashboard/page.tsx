'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Users, 
  BarChart3, 
  Sparkles, 
  ShoppingBag, 
  MessageSquare,
  Calendar,
  FileText,
  Search,
  Plus,
  ArrowRight,
  Package,
  MessageSquareText
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Types
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
  disabled?: boolean;
  className?: string;
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
  className = ''
}: DashboardCardProps) => {
  const colorVariants = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const colorClass = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  const cardContent = (
    <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${colorClass} text-white`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-foreground/70">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {disabled ? 'Coming soon' : 'Open'}
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

  return (
    <motion.div 
      variants={item}
      className="h-full"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Link href={href} className="h-full block">
        {cardContent}
      </Link>
    </motion.div>
  );
};

// Main Dashboard Component
export default function DashboardPage() {
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
      href: '/emails',
      color: 'blue'
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered assistance',
      icon: <Sparkles className="h-6 w-6" />,
      href: '/ai-assistant',
      color: 'purple'
    },
    {
      title: 'Contacts',
      description: 'Manage your business contacts',
      icon: <Users className="h-6 w-6" />,
      href: '/contacts',
      color: 'green'
    },
    {
      title: 'Orders',
      description: 'Track and manage orders',
      icon: <ShoppingBag className="h-6 w-6" />,
      href: '/orders',
      color: 'yellow'
    },
    {
      title: 'Products',
      description: 'Manage your product catalog',
      icon: <Package className="h-6 w-6" />,
      href: '/products',
      color: 'pink'
    },
    {
      title: 'Analytics',
      description: 'View business analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/analytics',
      color: 'indigo'
    },
    {
      title: 'Messages',
      description: 'Manage customer messages',
      icon: <MessageSquareText className="h-6 w-6" />,
      href: '/messages',
      color: 'blue',
      disabled: true
    },
    {
      title: 'Calendar',
      description: 'Schedule and manage events',
      icon: <Calendar className="h-6 w-6" />,
      href: '/calendar',
      color: 'purple',
      disabled: true
    }
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-full md:w-[300px]" 
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
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
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <motion.div 
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={container}
        >
          {features.map((feature) => (
            <DashboardCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              href={feature.href}
              color={feature.color as any}
              disabled={feature.disabled}
            />
          ))}
        </motion.div>
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
                  <MessageSquare className="h-5 w-5" />
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <DashboardCard
              title="Email"
              description="Check your inbox and manage emails"
              icon={<Mail className="h-5 w-5" />}
              href="/dashboard/email"
              color="blue"
            >
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">12 unread messages</p>
              </div>
            </DashboardCard>

            <DashboardCard
              title="AI Assistant"
              description="Get help with your tasks"
              icon={<Brain className="h-5 w-5" />}
              href="/dashboard/assistant"
              color="purple"
            />

            <DashboardCard
              title="Contacts"
              description="Manage your business contacts"
              icon={<Users className="h-5 w-5" />}
              href="/dashboard/contacts"
              color="green"
            />

            <DashboardCard
              title="Orders"
              description="View and manage orders"
              icon={<ShoppingBag className="h-5 w-5" />}
              href="/dashboard/orders"
              color="yellow"
            />

            <DashboardCard
              title="Products"
              description="Manage your product catalog"
              icon={<Package2 className="h-5 w-5" />}
              href="/dashboard/products"
              color="indigo"
            />

            <DashboardCard
              title="Calendar"
              description="Schedule and view events"
              icon={<Calendar className="h-5 w-5" />}
              href="#"
              color="pink"
              disabled
            />
          </motion.div>

          {/* Recent Activity Section */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <motion.div
                  key={item}
                  className="p-4 bg-card rounded-lg border shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * item }}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <MessageSquareText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">New message from client #{item}</h4>
                      <p className="text-sm text-muted-foreground">
                        You have a new message from a client regarding order #{1000 + item}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
      title: "Analytics",
      description: "View key metrics and insights about your business performance.",
      icon: BarChart3,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      gradientFrom: "#6366f1",
      gradientTo: "#3b82f6",
      href: "/dashboard/analytics",
      disabled: false,
      comingSoon: false
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
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4">
        <div className="absolute inset-0 bg-grid-white/[0.05]" />
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12 md:py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Welcome to <span className="aris-text-gradient font-extrabold">ARIS</span>
            </h1>
            <p className="text-lg text-white/90 max-w-3xl mx-auto mb-8">
              Transform your customer relationships with AI-powered insights and tools
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                asChild
                className="bg-white text-foreground hover:bg-gray-50 px-6 py-3 text-sm font-medium shadow-md rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link href="/dashboard/assistant" className="cursor-pointer">
                  <Activity className="mr-2 h-4 w-4 inline" />
                  Try AI Assistant
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-6 py-3 text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Explore Features</h2>
          <p className="text-gray-500">Discover the powerful tools and features available in your ARIS dashboard</p>
        </div>
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
