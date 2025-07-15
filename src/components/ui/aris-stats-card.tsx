'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface ArisStatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  index?: number;
  className?: string;
}

export const ArisStatsCard: React.FC<ArisStatsCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color,
  index = 0,
  className = '',
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className={className}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
              {change && (
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className={`text-sm font-medium ${getTrendColor()}`}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            <div 
              className="p-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ArisStatsCard; 