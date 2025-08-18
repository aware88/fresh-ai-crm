'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  Eye, 
  MessageSquare, 
  Settings, 
  Pause, 
  Play, 
  Square,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Target,
  PenTool,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailAIStep {
  id: string;
  type: 'thinking' | 'analyzing' | 'drafting' | 'reviewing' | 'completed';
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  details?: string[];
  timestamp: Date;
}

interface EmailAIMonitorProps {
  isActive: boolean;
  currentTask?: string;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onIntervene?: (step: EmailAIStep) => void;
  className?: string;
  compact?: boolean;
}

const DEMO_STEPS: EmailAIStep[] = [
  {
    id: '1',
    type: 'analyzing',
    title: 'Reading Email Context',
    description: 'Understanding customer inquiry and sentiment',
    status: 'completed',
    progress: 100,
    details: [
      'Customer inquiry about product return',
      'Neutral to slightly frustrated tone detected',
      'Order #12345 referenced',
      'Previous interaction history loaded'
    ],
    timestamp: new Date(Date.now() - 3000)
  },
  {
    id: '2',
    type: 'thinking',
    title: 'Selecting Response Strategy',
    description: 'Choosing appropriate tone and approach',
    status: 'completed',
    progress: 100,
    details: [
      'Professional yet empathetic tone selected',
      'Return policy information needed',
      'Proactive solution approach chosen'
    ],
    timestamp: new Date(Date.now() - 2000)
  },
  {
    id: '3',
    type: 'drafting',
    title: 'Generating Response',
    description: 'Writing personalized email response',
    status: 'active',
    progress: 65,
    details: [
      'Opening with acknowledgment ✓',
      'Explaining return process ✓', 
      'Adding helpful alternatives...',
      'Closing with next steps - pending'
    ],
    timestamp: new Date(Date.now() - 1000)
  },
  {
    id: '4',
    type: 'reviewing',
    title: 'Quality Review',
    description: 'Checking tone, accuracy, and completeness',
    status: 'pending',
    details: [
      'Grammar and spelling check',
      'Policy accuracy verification',
      'Tone appropriateness review',
      'Call-to-action clarity'
    ],
    timestamp: new Date()
  }
];

const getStepIcon = (type: EmailAIStep['type'], status: EmailAIStep['status']) => {
  const iconClass = "h-4 w-4";
  
  if (status === 'completed') {
    return <CheckCircle className={cn(iconClass, "text-green-500")} />;
  }
  
  if (status === 'error') {
    return <AlertCircle className={cn(iconClass, "text-red-500")} />;
  }
  
  if (status === 'active') {
    switch (type) {
      case 'thinking': return <Brain className={cn(iconClass, "text-blue-500 animate-pulse")} />;
      case 'analyzing': return <Eye className={cn(iconClass, "text-purple-500 animate-pulse")} />;
      case 'drafting': return <PenTool className={cn(iconClass, "text-orange-500 animate-pulse")} />;
      case 'reviewing': return <Settings className={cn(iconClass, "text-indigo-500 animate-pulse")} />;
      default: return <Zap className={cn(iconClass, "text-blue-500 animate-pulse")} />;
    }
  }
  
  // Pending state
  return <Clock className={cn(iconClass, "text-gray-400")} />;
};

const getStatusColor = (status: EmailAIStep['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'active': return 'bg-blue-100 text-blue-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function EmailAIMonitor({
  isActive,
  currentTask = "Drafting customer response",
  onPause,
  onResume,
  onStop,
  onIntervene,
  className = '',
  compact = false
}: EmailAIMonitorProps) {
  const [steps, setSteps] = useState<EmailAIStep[]>(DEMO_STEPS);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active step
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-status="active"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [steps]);

  // Simulate progress updates
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setSteps(prev => prev.map(step => {
        if (step.status === 'active' && step.progress !== undefined && step.progress < 100) {
          return { ...step, progress: Math.min(step.progress + 5, 100) };
        }
        return step;
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  };

  const activeStep = steps.find(step => step.status === 'active');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalProgress = (completedSteps / steps.length) * 100;

  if (compact && !isExpanded) {
    return (
      <Card className={cn("border-l-4 border-l-blue-500", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Email AI</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedModel}
                </Badge>
              </div>
              {activeStep && (
                <div className="flex items-center space-x-2">
                  {getStepIcon(activeStep.type, activeStep.status)}
                  <span className="text-sm text-gray-600">{activeStep.title}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={totalProgress} className="w-16 h-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Email AI Assistant
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{currentTask}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Model: {selectedModel}
            </Badge>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePauseResume}
            disabled={!isActive}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
            disabled={!isActive}
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto" ref={scrollRef}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              data-status={step.status}
              className={cn(
                "flex items-start space-x-3 p-3 rounded-lg border transition-all",
                step.status === 'active' && "bg-blue-50 border-blue-200",
                step.status === 'completed' && "bg-green-50 border-green-200",
                step.status === 'error' && "bg-red-50 border-red-200",
                step.status === 'pending' && "bg-gray-50 border-gray-200"
              )}
            >
              {/* Step Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step.type, step.status)}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {step.title}
                  </h4>
                  <Badge className={cn("text-xs", getStatusColor(step.status))}>
                    {step.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>

                {/* Progress Bar for Active Step */}
                {step.status === 'active' && step.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={step.progress} className="h-1.5" />
                    <p className="text-xs text-gray-500 mt-1">
                      {step.progress}% complete
                    </p>
                  </div>
                )}

                {/* Step Details */}
                {step.details && step.details.length > 0 && (
                  <div className="mt-2">
                    <ul className="text-xs text-gray-600 space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start space-x-2">
                          <span className="text-gray-400">•</span>
                          <span className={cn(
                            detail.includes('✓') && "text-green-600 font-medium"
                          )}>
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Intervention Button */}
                {step.status === 'active' && onIntervene && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs h-6"
                    onClick={() => onIntervene(step)}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Intervene
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Steps: {completedSteps}/{steps.length}</span>
              <span>•</span>
              <span>Started: {new Date().toLocaleTimeString()}</span>
            </div>
            {isPaused && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                Paused
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

