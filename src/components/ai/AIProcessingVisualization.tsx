'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Meteors } from '@/components/magicui/meteors';
import { 
  Brain, 
  Zap, 
  MessageSquare, 
  Database, 
  Target,
  CheckCircle,
  Clock,
  Activity,
  Sparkles
} from 'lucide-react';

interface AIProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
  duration?: number;
}

interface AIProcessingVisualizationProps {
  isProcessing?: boolean;
  currentStep?: string;
  steps?: AIProcessingStep[];
  className?: string;
}

const defaultSteps: AIProcessingStep[] = [
  {
    id: 'data-ingestion',
    title: 'Data Ingestion',
    description: 'Collecting and parsing customer data',
    icon: Database,
    status: 'completed',
    progress: 100,
    duration: 2000
  },
  {
    id: 'ai-analysis',
    title: 'AI Analysis',
    description: 'Processing with advanced ML algorithms',
    icon: Brain,
    status: 'processing',
    progress: 75,
    duration: 3000
  },
  {
    id: 'insight-generation',
    title: 'Insight Generation',
    description: 'Creating actionable recommendations',
    icon: Sparkles,
    status: 'processing',
    progress: 45,
    duration: 2500
  },
  {
    id: 'response-crafting',
    title: 'Response Crafting',
    description: 'Personalizing communication strategy',
    icon: MessageSquare,
    status: 'pending',
    progress: 0,
    duration: 2000
  }
];

export function AIProcessingVisualization({
  isProcessing = true,
  currentStep = 'ai-analysis',
  steps = defaultSteps,
  className = ''
}: AIProcessingVisualizationProps) {
  const [animatedSteps, setAnimatedSteps] = useState(steps);
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setAnimatedSteps(prev => {
        const newSteps = prev.map(step => {
          if (step.status === 'processing' && step.progress < 100) {
            return {
              ...step,
              progress: Math.min(step.progress + Math.random() * 5, 100)
            };
          }
          return step;
        });

        // Calculate total progress
        const completed = newSteps.filter(s => s.status === 'completed').length;
        const processing = newSteps.filter(s => s.status === 'processing');
        const processingProgress = processing.reduce((sum, s) => sum + s.progress, 0);
        const total = (completed * 100 + processingProgress) / newSteps.length;
        setTotalProgress(total);

        return newSteps;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Activity;
      default: return Clock;
    }
  };

  return (
    <Card className={`relative overflow-hidden border-dashed ${className}`}>
      {isProcessing && <Meteors number={20} />}
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Processing Pipeline
          </CardTitle>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            {isProcessing ? 'Active' : 'Idle'}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <AnimatePresence>
          {animatedSteps.map((step, index) => {
            const StepIcon = step.icon;
            const StatusIcon = getStepIcon(step.status);
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-lg border transition-all duration-500 ${getStepStatusColor(step.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`p-2 rounded-lg ${
                      step.status === 'processing' 
                        ? 'bg-blue-500/20 animate-pulse' 
                        : step.status === 'completed'
                        ? 'bg-green-500/20'
                        : 'bg-gray-500/20'
                    }`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <StatusIcon className="h-3 w-3" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{step.title}</h4>
                      <span className="text-xs opacity-70">
                        {step.status === 'processing' && `${Math.round(step.progress)}%`}
                      </span>
                    </div>
                    
                    <p className="text-sm opacity-80">{step.description}</p>
                    
                    {step.status === 'processing' && (
                      <div className="space-y-1">
                        <Progress value={step.progress} className="h-1" />
                        {step.progress > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs opacity-60"
                          >
                            Processing... {Math.round(step.progress)}% complete
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing animation overlay */}
                {step.status === 'processing' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
                    animate={{
                      x: [-100, 300],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Real-time metrics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashed">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {animatedSteps.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {animatedSteps.filter(s => s.status === 'processing').length}
            </div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {animatedSteps.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

