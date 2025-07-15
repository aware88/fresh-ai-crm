'use client';

import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ArisSkeletonCard, ArisPageLoading } from './aris-loading';

// Memoization utilities
export const memo = React.memo;
export const useMemo = React.useMemo;
export const useCallback = React.useCallback;

// Optimized component wrapper
interface ArisOptimizedProps {
  children: React.ReactNode;
  deps?: React.DependencyList;
  shouldUpdate?: (prevProps: any, nextProps: any) => boolean;
}

export const ArisOptimized = React.memo<ArisOptimizedProps>(
  ({ children }) => <>{children}</>,
  (prevProps, nextProps) => {
    if (prevProps.shouldUpdate) {
      return !prevProps.shouldUpdate(prevProps, nextProps);
    }
    return JSON.stringify(prevProps.deps) === JSON.stringify(nextProps.deps);
  }
);

// Lazy loading wrapper with error boundary
interface ArisLazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

class ArisErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ARIS Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 text-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ArisLazy = ({ children, fallback, errorFallback }: ArisLazyProps) => (
  <ArisErrorBoundary fallback={errorFallback}>
    <Suspense fallback={fallback || <ArisSkeletonCard />}>
      {children}
    </Suspense>
  </ArisErrorBoundary>
);

// Code splitting utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <ArisLazy fallback={fallback}>
      <LazyComponent {...(props as any)} ref={ref} />
    </ArisLazy>
  ));
};

// Virtual scrolling hook for large lists
interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = <T,>(
  items: T[],
  options: UseVirtualScrollOptions
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const { itemHeight, containerHeight, overscan = 3 } = options;
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );
  
  const paddingTop = visibleStart * itemHeight;
  const paddingBottom = (items.length - visibleEnd - 1) * itemHeight;
  
  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    Math.min(items.length, visibleEnd + 1 + overscan)
  );
  
  return {
    visibleItems,
    paddingTop,
    paddingBottom,
    setScrollTop,
    visibleStart,
    visibleEnd
  };
};

// Debounced input hook
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled function hook
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const [throttledFunc, setThrottledFunc] = React.useState<T | null>(null);

  React.useEffect(() => {
    let lastCall = 0;
    const throttled = ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    }) as T;

    setThrottledFunc(() => throttled);
  }, [func, delay]);

  return throttledFunc || func;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
};

// Optimized list component
interface ArisOptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemHeight?: number;
  maxHeight?: number;
  enableVirtualization?: boolean;
}

export const ArisOptimizedList = <T,>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemHeight = 60,
  maxHeight = 400,
  enableVirtualization = false
}: ArisOptimizedListProps<T>) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const virtualScroll = useVirtualScroll(items, {
    itemHeight,
    containerHeight: maxHeight
  });

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (enableVirtualization) {
        virtualScroll.setScrollTop(e.currentTarget.scrollTop);
      }
    },
    [enableVirtualization, virtualScroll]
  );

  const MemoizedItem = React.memo(({ item, index }: { item: T; index: number }) => (
    <div key={keyExtractor(item, index)}>
      {renderItem(item, index)}
    </div>
  ));

  if (enableVirtualization) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{ height: maxHeight, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ paddingTop: virtualScroll.paddingTop }}>
          {virtualScroll.visibleItems.map((item, index) => (
            <MemoizedItem
              key={keyExtractor(item, virtualScroll.visibleStart + index)}
              item={item}
              index={virtualScroll.visibleStart + index}
            />
          ))}
        </div>
        <div style={{ paddingBottom: virtualScroll.paddingBottom }} />
      </div>
    );
  }

  return (
    <div className={className} style={{ maxHeight, overflow: 'auto' }}>
      {items.map((item, index) => (
        <MemoizedItem
          key={keyExtractor(item, index)}
          item={item}
          index={index}
        />
      ))}
    </div>
  );
};

// Image optimization component
interface ArisOptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export const ArisOptimizedImage = React.memo<ArisOptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleLoad = React.useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className={`absolute inset-0 ${className}`}
          style={{ width, height, filter: 'blur(20px)' }}
        />
      )}
      <motion.img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        {...(props as any)}
      />
    </div>
  );
});

ArisOptimizedImage.displayName = 'ArisOptimizedImage';

// Bundle size analyzer (development only)
export const bundleAnalyzer = {
  logComponentSize: (componentName: string, component: React.ComponentType) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Component ${componentName} bundle size:`, component.toString().length);
    }
  },
  
  measureRenderTime: (componentName: string, renderFn: () => void) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      renderFn();
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    }
  }
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = React.useRef(0);
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} - Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  return {
    renderCount: renderCount.current,
    measureOperation: (operationName: string, operation: () => void) => {
      const start = performance.now();
      operation();
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName}.${operationName} took ${(end - start).toFixed(2)}ms`);
      }
    }
  };
};

// Memory usage tracker
export const useMemoryTracker = (componentName: string) => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log(`${componentName} memory usage:`, {
        used: `${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }, [componentName]);
}; 