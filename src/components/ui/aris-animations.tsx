'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Enhanced Button Animation Component
interface ArisAnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const ArisAnimatedButton = React.forwardRef<HTMLButtonElement, ArisAnimatedButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:ring-blue-500 shadow-lg hover:shadow-xl",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
      outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    };
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          (loading || disabled) && "opacity-70 cursor-not-allowed",
          className
        )}
        disabled={loading || disabled}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...(props as any)}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Loading...</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

ArisAnimatedButton.displayName = 'ArisAnimatedButton';

// Enhanced Card Animation Component
interface ArisAnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const ArisAnimatedCard = ({ children, className, hover = true, delay = 0 }: ArisAnimatedCardProps) => {
  return (
    <motion.div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { 
        y: -4, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      } : undefined}
    >
      {children}
    </motion.div>
  );
};

// Stats Card with Counter Animation
interface ArisAnimatedStatsProps {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: React.ReactNode;
  delay?: number;
}

export const ArisAnimatedStats = ({ 
  title, 
  value, 
  previousValue = 0, 
  suffix = '', 
  prefix = '', 
  trend = 'neutral', 
  trendValue, 
  icon, 
  delay = 0 
}: ArisAnimatedStatsProps) => {
  const [displayValue, setDisplayValue] = React.useState(previousValue);
  
  React.useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = (value - previousValue) / steps;
    let current = previousValue;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, previousValue]);
  
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };
  
  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };
  
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <motion.p 
              className="text-2xl font-bold text-gray-900"
              key={displayValue}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {prefix}{displayValue.toLocaleString()}{suffix}
            </motion.p>
            {trendValue && (
              <motion.span
                className={cn("text-sm font-medium", trendColors[trend])}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {trendIcons[trend]} {trendValue}%
              </motion.span>
            )}
          </div>
        </div>
        {icon && (
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Page Transition Component
interface ArisPageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const ArisPageTransition = ({ children, className }: ArisPageTransitionProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// List Animation Component
interface ArisAnimatedListProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export const ArisAnimatedList = ({ children, className, stagger = 0.1 }: ArisAnimatedListProps) => {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      custom={stagger}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          transition={{ delay: index * stagger }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Notification Animation Component
interface ArisNotificationProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const ArisNotification = ({ show, message, type = 'info', onClose }: ArisNotificationProps) => {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            "fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm",
            colors[type]
          )}
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{message}</p>
            <button
              onClick={onClose}
              className="ml-3 text-lg leading-none hover:opacity-70"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Loading Skeleton Component
interface ArisSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export const ArisSkeleton = ({ className, lines = 3, avatar = false }: ArisSkeletonProps) => {
  return (
    <div className={cn("animate-pulse", className)}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 rounded"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
};

// Floating Action Button
interface ArisFloatingButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ArisFloatingButton = ({ 
  onClick, 
  icon, 
  label, 
  position = 'bottom-right' 
}: ArisFloatingButtonProps) => {
  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };
  
  return (
    <motion.button
      className={cn(
        "fixed z-50 w-14 h-14 rounded-full shadow-lg",
        "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600",
        "text-white flex items-center justify-center",
        "hover:shadow-xl transition-shadow duration-200",
        positions[position]
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      title={label}
    >
      {icon}
    </motion.button>
  );
}; 