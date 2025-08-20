'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Mail,
  Brain,
  Zap,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  status: 'pending' | 'active' | 'completed';
}

interface FollowUpVisualDemoProps {
  className?: string;
}

export default function FollowUpVisualDemo({ className }: FollowUpVisualDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [demoStats, setDemoStats] = useState({
    emailsSent: 0,
    responsesReceived: 0,
    aiDraftsGenerated: 0,
    timeSaved: 0,
    responseRate: 0
  });

  const demoSteps: DemoStep[] = [
    {
      id: 'email-sent',
      title: 'Email Sent',
      description: 'User sends an important business email',
      icon: <Mail className="h-5 w-5 text-blue-600" />,
      duration: 1000,
      status: 'pending'
    },
    {
      id: 'followup-created',
      title: 'Follow-up Created',
      description: 'System automatically creates follow-up reminder',
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      duration: 1500,
      status: 'pending'
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'ML engine analyzes recipient patterns and optimal timing',
      icon: <Brain className="h-5 w-5 text-purple-600" />,
      duration: 2000,
      status: 'pending'
    },
    {
      id: 'draft-generation',
      title: 'Draft Generated',
      description: 'AI creates personalized follow-up draft',
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      duration: 1500,
      status: 'pending'
    },
    {
      id: 'auto-send',
      title: 'Automated Send',
      description: 'System sends follow-up at optimal time',
      icon: <Target className="h-5 w-5 text-green-600" />,
      duration: 1000,
      status: 'pending'
    },
    {
      id: 'response-received',
      title: 'Response Received',
      description: 'Recipient responds, follow-up marked as successful',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      duration: 2000,
      status: 'pending'
    }
  ];

  const [steps, setSteps] = useState(demoSteps);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentStep < steps.length) {
      const currentStepData = steps[currentStep];
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (currentStepData.duration / 50));
          
          if (newProgress >= 100) {
            // Complete current step
            setSteps(prevSteps => 
              prevSteps.map((step, index) => ({
                ...step,
                status: index === currentStep ? 'completed' : 
                       index === currentStep + 1 ? 'active' : 
                       index < currentStep ? 'completed' : 'pending'
              }))
            );
            
            // Update stats
            updateDemoStats(currentStepData.id);
            
            // Move to next step
            if (currentStep < steps.length - 1) {
              setCurrentStep(prev => prev + 1);
              setProgress(0);
            } else {
              setIsPlaying(false);
            }
            
            return 0;
          }
          
          return newProgress;
        });
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStep, steps]);

  const updateDemoStats = (stepId: string) => {
    setDemoStats(prev => {
      switch (stepId) {
        case 'email-sent':
          return { ...prev, emailsSent: prev.emailsSent + 1 };
        case 'draft-generation':
          return { ...prev, aiDraftsGenerated: prev.aiDraftsGenerated + 1 };
        case 'auto-send':
          return { ...prev, timeSaved: prev.timeSaved + 15 }; // 15 minutes saved
        case 'response-received':
          return { 
            ...prev, 
            responsesReceived: prev.responsesReceived + 1,
            responseRate: prev.emailsSent > 0 ? ((prev.responsesReceived + 1) / prev.emailsSent) * 100 : 100
          };
        default:
          return prev;
      }
    });
  };

  const handlePlay = () => {
    if (currentStep >= steps.length) {
      resetDemo();
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setSteps(demoSteps);
    setDemoStats({
      emailsSent: 0,
      responsesReceived: 0,
      aiDraftsGenerated: 0,
      timeSaved: 0,
      responseRate: 0
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Follow-up System Demo
          </h3>
          <p className="text-sm text-gray-600">
            Watch how AI automation transforms email follow-up
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isPlaying ? (
            <Button onClick={handlePlay}>
              <Play className="h-4 w-4 mr-2" />
              {currentStep >= steps.length ? 'Restart' : 'Play'}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={resetDemo} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Demo Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{demoStats.emailsSent}</div>
            <div className="text-xs text-gray-600">Emails Sent</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{demoStats.aiDraftsGenerated}</div>
            <div className="text-xs text-gray-600">AI Drafts</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{demoStats.responsesReceived}</div>
            <div className="text-xs text-gray-600">Responses</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{demoStats.timeSaved}m</div>
            <div className="text-xs text-gray-600">Time Saved</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {demoStats.responseRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Response Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Automation Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0.5 }}
                animate={{ 
                  opacity: step.status === 'completed' ? 1 : step.status === 'active' ? 1 : 0.5,
                  scale: step.status === 'active' ? 1.02 : 1
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  step.status === 'active' ? 'border-blue-300 bg-blue-50' :
                  step.status === 'completed' ? 'border-green-300 bg-green-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'active' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    step.icon
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <Badge variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'active' ? 'secondary' :
                      'outline'
                    }>
                      {step.status === 'completed' ? 'Done' :
                       step.status === 'active' ? 'Active' :
                       'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  
                  {step.status === 'active' && (
                    <div className="mt-2">
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">95% Automation</h4>
                <p className="text-sm text-gray-600">Eliminate manual follow-up work</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">25% Higher Response</h4>
                <p className="text-sm text-gray-600">AI-optimized timing & content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">84.7% ML Accuracy</h4>
                <p className="text-sm text-gray-600">Industry-leading predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Message */}
      <AnimatePresence>
        {currentStep >= steps.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Demo Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  You've seen how our AI-powered system automates 95% of follow-up work while 
                  increasing response rates by 25%. Ready to transform your email productivity?
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={resetDemo}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Run Demo Again
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Schedule Demo Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



