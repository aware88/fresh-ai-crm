'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, FileText } from 'lucide-react';

interface DraftLoadingAnimationProps {
  message?: string;
}

export function DraftLoadingAnimation({ message = "Generating AI draft..." }: DraftLoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
      <div className="text-center space-y-6">
        {/* Animated Icons */}
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0] 
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="relative"
          >
            <Brain className="h-16 w-16 text-blue-500 mx-auto" />
            <motion.div
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0.5, 1, 0.5] 
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.div>
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <motion.h3
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="text-lg font-semibold text-gray-800"
          >
            {message}
          </motion.h3>
          
          {/* Animated Dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 text-sm text-gray-600">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Analyzing email content</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            ></motion.div>
            <span>Generating intelligent response</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-gray-400">Finalizing draft</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


