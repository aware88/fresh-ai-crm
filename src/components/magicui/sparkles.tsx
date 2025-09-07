'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

interface SparklesProps {
  className?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  children?: React.ReactNode;
  trigger?: boolean;
}

const defaultColors = [
  '#FFD700', // Gold
  '#FFA500', // Orange
  '#FF69B4', // Hot Pink
  '#00CED1', // Dark Turquoise
  '#98FB98', // Pale Green
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
  '#87CEEB', // Sky Blue
];

export function Sparkles({
  className = '',
  count = 20,
  minSize = 4,
  maxSize = 12,
  colors = defaultColors,
  children,
  trigger = true,
}: SparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (!trigger) {
      setSparkles([]);
      return;
    }

    const generateSparkle = (): Sparkle => ({
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (maxSize - minSize) + minSize,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    const initialSparkles = Array.from({ length: count }, generateSparkle);
    setSparkles(initialSparkles);

    const interval = setInterval(() => {
      setSparkles(prev => {
        // Remove old sparkles and add new ones
        const filtered = prev.filter(sparkle => 
          Date.now() - parseInt(sparkle.id, 36) < sparkle.duration * 1000
        );
        
        // Add new sparkles randomly
        if (Math.random() > 0.7) {
          filtered.push(generateSparkle());
        }
        
        return filtered;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [count, minSize, maxSize, colors, trigger]);

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
              }}
              initial={{ 
                scale: 0, 
                rotate: 0,
                opacity: 0 
              }}
              animate={{ 
                scale: [0, 1, 0], 
                rotate: [0, 180, 360],
                opacity: [0, 1, 0],
                x: [0, Math.random() * 20 - 10],
                y: [0, Math.random() * 20 - 10],
              }}
              exit={{ 
                scale: 0, 
                opacity: 0 
              }}
              transition={{
                duration: sparkle.duration,
                delay: sparkle.delay,
                ease: 'easeInOut',
              }}
            >
              <Star 
                size={sparkle.size} 
                color={sparkle.color} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface StarProps {
  size: number;
  color: string;
}

function Star({ size, color }: StarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{
        filter: `drop-shadow(0 0 ${size/2}px ${color}40)`,
      }}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// Alternative sparkle component for specific use cases
export function SparkleEffect({ 
  children, 
  className = '',
  intensity = 'normal' 
}: { 
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'normal' | 'high';
}) {
  const getSparkleConfig = () => {
    switch (intensity) {
      case 'low':
        return { count: 8, minSize: 3, maxSize: 6 };
      case 'high':
        return { count: 35, minSize: 6, maxSize: 16 };
      default:
        return { count: 20, minSize: 4, maxSize: 12 };
    }
  };

  const config = getSparkleConfig();

  return (
    <Sparkles className={className} {...config}>
      {children}
    </Sparkles>
  );
}

