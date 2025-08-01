'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSubscriptionFeatures } from "@/hooks/useSubscriptionFeatures";
import DashboardCard from './DashboardCard';

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  color?: string;
  disabled?: boolean;
  featureKey?: string;
  requiredPlan?: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

const FeaturesGrid = ({ features }: FeaturesGridProps) => {
  const { data: session } = useSession();
  const organizationId = (session?.user as any)?.organizationId || "";
  const { hasFeature } = useSubscriptionFeatures(organizationId);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Function to check if user has access to a feature
  const checkFeatureAccess = (featureKey: string) => {
    return !featureKey || hasFeature(featureKey, true);
  };

  // Filter features based on active tab
  const filteredFeatures = features.filter(feature => {
    if (activeTab === "all") return true;
    if (activeTab === "available") return !feature.disabled && (!feature.featureKey || checkFeatureAccess(feature.featureKey));
    if (activeTab === "premium") return feature.featureKey && !checkFeatureAccess(feature.featureKey);
    return false;
  });

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 overflow-auto pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          All Features
        </button>
        <button
          onClick={() => setActiveTab("available")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeTab === "available"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setActiveTab("premium")}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeTab === "premium"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Premium
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="wait">
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <DashboardCard
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FeaturesGrid;
