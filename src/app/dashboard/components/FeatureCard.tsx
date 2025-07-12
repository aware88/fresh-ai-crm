'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useSubscriptionFeatures } from "@/hooks/useSubscriptionFeatures";
import { Crown, ArrowRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  href: string;
  onRef?: (el: HTMLElement) => void;
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
      toast({
        title: "Premium Feature",
        description: `This feature requires the ${requiredPlan} plan. Upgrade your subscription to access it.`,
        variant: "default",
      });
      router.push("/settings/subscription");
    }
  };

  const cardContent = (
    <>
      <div className="block p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <h3 className="font-medium">{title}</h3>
          </div>
          {isPremium && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3" />
                <span>Premium</span>
              </div>
            </Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isPremium ? `Requires ${requiredPlan} plan` : 'Available'}
          </div>
          <ArrowRight className={`h-4 w-4 ${isPremium ? 'text-amber-500' : 'text-blue-500'}`} />
        </div>
      </div>
      <div 
        className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
        style={{
          background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})`
        }}
      />
    </>
  );

  if (disabled) {
    return (
      <motion.div
        ref={onRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-gray-950 dark:border-gray-800 opacity-60"
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
                    <div className="flex items-center space-x-1">
                      <Crown className="h-3 w-3" />
                      <span>Premium</span>
                    </div>
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Requires {requiredPlan} plan</div>
                  <ArrowRight className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-900/10 dark:to-amber-800/5 pointer-events-none" />
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
      <a href={href} className="block">
        {cardContent}
      </a>
    </motion.div>
  );
};

export default FeatureCard;
