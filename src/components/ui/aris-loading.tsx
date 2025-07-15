'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Basic Loading Spinner
interface ArisSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ArisSpinner = ({ size = 'md', className }: ArisSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn(
        'border-2 border-transparent border-t-current rounded-full',
        sizes[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Rainbow Loading Spinner
export const ArisRainbowSpinner = ({ size = 'md', className }: ArisSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={cn(
        'rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
        sizes[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{
        background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
        maskImage: 'radial-gradient(circle, transparent 30%, black 32%, black 68%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle, transparent 30%, black 32%, black 68%, transparent 70%)'
      }}
    />
  );
};

// Pulsing Dots Loader
export const ArisPulsingDots = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Skeleton Components
interface ArisSkeletonProps {
  className?: string;
}

export const ArisSkeletonLine = ({ className }: ArisSkeletonProps) => (
  <div className={cn('h-4 bg-gray-200 rounded animate-pulse', className)} />
);

export const ArisSkeletonCircle = ({ className }: ArisSkeletonProps) => (
  <div className={cn('w-12 h-12 bg-gray-200 rounded-full animate-pulse', className)} />
);

export const ArisSkeletonCard = ({ className }: ArisSkeletonProps) => (
  <div className={cn('p-6 bg-white rounded-lg shadow-sm border border-gray-200', className)}>
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <ArisSkeletonCircle />
        <div className="flex-1 space-y-2">
          <ArisSkeletonLine className="w-3/4" />
          <ArisSkeletonLine className="w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <ArisSkeletonLine />
        <ArisSkeletonLine className="w-5/6" />
        <ArisSkeletonLine className="w-4/6" />
      </div>
    </div>
  </div>
);

// Table Skeleton
interface ArisSkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const ArisSkeletonTable = ({ rows = 5, columns = 4, className }: ArisSkeletonTableProps) => (
  <div className={cn('w-full', className)}>
    <div className="animate-pulse">
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <ArisSkeletonLine key={i} className="h-6" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <ArisSkeletonLine key={colIndex} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Stats Cards Skeleton
export const ArisSkeletonStats = ({ count = 4, className }: { count?: number; className?: string }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <ArisSkeletonLine className="w-3/4 h-4 mb-2" />
              <ArisSkeletonLine className="w-1/2 h-8" />
            </div>
            <ArisSkeletonCircle className="w-8 h-8" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Page Loading Component
interface ArisPageLoadingProps {
  title?: string;
  description?: string;
  showStats?: boolean;
  showTable?: boolean;
  showCards?: boolean;
}

export const ArisPageLoading = ({ 
  title = "Loading...", 
  description = "Please wait while we load your data",
  showStats = true,
  showTable = true,
  showCards = true
}: ArisPageLoadingProps) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <ArisRainbowSpinner size="md" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            <p className="text-gray-600 mt-2">{description}</p>
          </div>
          <div className="animate-pulse">
            <div className="w-24 h-10 bg-gray-200 rounded-md" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="mb-8">
          <ArisSkeletonStats />
        </div>
      )}

      {/* Cards */}
      {showCards && (
        <div className="mb-8">
          <ArisSkeletonLine className="w-32 h-6 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArisSkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {showTable && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ArisSkeletonLine className="w-40 h-6 mb-4" />
            <ArisSkeletonTable />
          </div>
        </div>
      )}
    </div>
  </div>
);

// Form Loading State
export const ArisFormLoading = ({ fields = 6 }: { fields?: number }) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <ArisSkeletonLine className="w-48 h-8" />
      <ArisSkeletonLine className="w-64 h-4" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <ArisSkeletonLine className="w-24 h-4" />
          <ArisSkeletonLine className="w-full h-10" />
        </div>
      ))}
    </div>
    
    <div className="flex justify-end space-x-3">
      <ArisSkeletonLine className="w-20 h-10" />
      <ArisSkeletonLine className="w-32 h-10" />
    </div>
  </div>
);

// Loading Overlay
interface ArisLoadingOverlayProps {
  show: boolean;
  message?: string;
  children?: React.ReactNode;
}

export const ArisLoadingOverlay = ({ show, message = "Loading...", children }: ArisLoadingOverlayProps) => (
  <div className="relative">
    {children}
    {show && (
      <motion.div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center">
          <ArisRainbowSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </motion.div>
    )}
  </div>
);

// Progress Bar
interface ArisProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const ArisProgressBar = ({ progress, className, showPercentage = true }: ArisProgressBarProps) => (
  <div className={cn('w-full', className)}>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium text-gray-700">Progress</span>
      {showPercentage && (
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      )}
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  </div>
);

// Lazy Loading Component
interface ArisLazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const ArisLazyLoad = ({ children, fallback, className }: ArisLazyLoadProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (isVisible) {
      // Simulate loading delay
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div ref={ref} className={className}>
      {isLoaded ? children : (fallback || <ArisSkeletonCard />)}
    </div>
  );
}; 