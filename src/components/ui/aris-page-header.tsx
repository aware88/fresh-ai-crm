'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export interface ArisPageHeaderProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
  className?: string;
}

export const ArisPageHeader: React.FC<ArisPageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className = '',
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${className}`}
    >
      <div className="absolute inset-0 bg-black/5" />
      <div className="relative p-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-white mb-2"
            >
              {title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-lg"
            >
              {description}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden md:flex items-center gap-4"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Icon className="h-12 w-12 text-white" />
            </div>
            {children}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArisPageHeader; 