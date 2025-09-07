'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DotPattern } from '@/components/magicui/dot-pattern';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'success' | 'warning' | 'info' | 'subtle';
  animated?: boolean;
  withDots?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GradientBackground({
  children,
  className = '',
  variant = 'default',
  animated = true,
  withDots = false,
  blur = 'lg'
}: GradientBackgroundProps) {
  const getGradientClasses = () => {
    const baseClasses = 'relative overflow-hidden';
    
    switch (variant) {
      case 'premium':
        return `${baseClasses} bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20`;
      case 'success':
        return `${baseClasses} bg-gradient-to-br from-green-900/20 via-emerald-900/20 to-teal-900/20`;
      case 'warning':
        return `${baseClasses} bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-red-900/20`;
      case 'info':
        return `${baseClasses} bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-sky-900/20`;
      case 'subtle':
        return `${baseClasses} bg-gradient-to-br from-gray-900/10 via-slate-900/10 to-zinc-900/10`;
      default:
        return `${baseClasses} bg-gradient-to-br from-slate-900/20 via-gray-900/20 to-zinc-900/20`;
    }
  };

  const getBlurIntensity = () => {
    switch (blur) {
      case 'sm': return 'blur-sm';
      case 'md': return 'blur-md';
      case 'lg': return 'blur-lg';
      case 'xl': return 'blur-xl';
      default: return 'blur-lg';
    }
  };

  const getAnimationVariant = () => {
    switch (variant) {
      case 'premium':
        return {
          background: [
            'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 60% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 60% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)',
          ]
        };
      case 'success':
        return {
          background: [
            'radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)',
          ]
        };
      default:
        return {
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
          ]
        };
    }
  };

  return (
    <div className={cn(getGradientClasses(), className)}>
      {/* Animated background gradients */}
      {animated && (
        <motion.div
          className={`absolute inset-0 ${getBlurIntensity()}`}
          animate={getAnimationVariant()}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear',
          }}
        />
      )}

      {/* Static background for non-animated version */}
      {!animated && (
        <div className={`absolute inset-0 ${getBlurIntensity()}`} />
      )}

      {/* Dot pattern overlay */}
      {withDots && (
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className="absolute inset-0 opacity-30"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Preset components for common use cases
export function PremiumBackground({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GradientBackground variant="premium" animated withDots className={className}>
      {children}
    </GradientBackground>
  );
}

export function SuccessBackground({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GradientBackground variant="success" animated className={className}>
      {children}
    </GradientBackground>
  );
}

export function SubtleBackground({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <GradientBackground variant="subtle" blur="md" className={className}>
      {children}
    </GradientBackground>
  );
}

