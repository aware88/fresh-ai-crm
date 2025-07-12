'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSubscriptionFeatures } from "@/hooks/useSubscriptionFeatures";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

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
    amber: 'from-amber-500 to-amber-600',
    cyan: 'from-cyan-500 to-cyan-600',
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
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400`}>
            {icon}
          </div>
          {isPremium && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
              </div>
            </Badge>
          )}
          {disabled && (
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/30">
              Coming Soon
            </Badge>
          )}
        </div>
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end">
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white`}>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Different rendering based on card state
  if (disabled) {
    return (
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="show"
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          delay: index * 0.05
        }}
        className="h-full opacity-70"
      >
        {cardContent}
      </motion.div>
    );
  }
  
  if (isPremium) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate="show"
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
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      initial="hidden"
      animate="show"
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: index * 0.05
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="h-full"
    >
      <a href={href} className="h-full block">
        {cardContent}
      </a>
    </motion.div>
  );
};

export default DashboardCard;
