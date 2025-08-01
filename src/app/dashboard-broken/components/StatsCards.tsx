'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface StatsCardsProps {
  stats: Stat[];
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: index * 0.05
          }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <div
                className={cn(
                  "flex items-center rounded-full px-2 py-1 text-xs font-medium",
                  {
                    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400":
                      stat.changeType === "positive",
                    "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400":
                      stat.changeType === "negative",
                    "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400":
                      stat.changeType === "neutral",
                  }
                )}
              >
                {stat.changeType === "positive" ? (
                  <ArrowUpIcon className="mr-1 h-3 w-3" />
                ) : stat.changeType === "negative" ? (
                  <ArrowDownIcon className="mr-1 h-3 w-3" />
                ) : null}
                {stat.change}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
