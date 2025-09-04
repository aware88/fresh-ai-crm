/**
 * Lead Score Card Component
 * Displays lead score with visual indicators and breakdown
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import type { LeadScore, ScoreBreakdown, QualificationStatus } from '@/types/lead-scoring';

interface LeadScoreCardProps {
  score: LeadScore;
  breakdown?: ScoreBreakdown;
  showBreakdown?: boolean;
  onStatusChange?: (contactId: string, status: QualificationStatus) => void;
  className?: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getStatusBadge = (status: QualificationStatus) => {
  const variants = {
    hot: 'bg-red-500 hover:bg-red-600',
    warm: 'bg-orange-500 hover:bg-orange-600',
    cold: 'bg-blue-500 hover:bg-blue-600',
    unqualified: 'bg-gray-500 hover:bg-gray-600'
  };

  const labels = {
    hot: 'Hot Lead',
    warm: 'Warm Lead',
    cold: 'Cold Lead',
    unqualified: 'Unqualified'
  };

  return (
    <Badge className={`${variants[status]} text-white`}>
      {labels[status]}
    </Badge>
  );
};

const ScoreBreakdownSection: React.FC<{ 
  title: string; 
  score: number; 
  maxScore: number; 
  factors: string[];
  icon?: React.ReactNode;
}> = ({ title, score, maxScore, factors, icon }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <span className="text-sm text-muted-foreground">
        {score}/{maxScore}
      </span>
    </div>
    <Progress 
      value={(score / maxScore) * 100} 
      className="h-2"
    />
    {factors.length > 0 && (
      <div className="text-xs text-muted-foreground">
        {factors.map((factor, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="w-1 h-1 bg-current rounded-full" />
            {factor}
          </div>
        ))}
      </div>
    )}
  </div>
);

export const LeadScoreCard: React.FC<LeadScoreCardProps> = ({
  score,
  breakdown,
  showBreakdown = true,
  onStatusChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleStatusChange = (newStatus: QualificationStatus) => {
    if (onStatusChange) {
      onStatusChange(score.contact_id, newStatus);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Lead Score</CardTitle>
          {getStatusBadge(score.qualification_status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score Display */}
        <div className="text-center space-y-2">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-full h-full rounded-full border-8 border-gray-200 dark:border-gray-700">
              <div 
                className={`absolute inset-0 rounded-full border-8 border-transparent ${getScoreBgColor(score.overall_score)}`}
                style={{
                  clipPath: `polygon(0 0, ${(score.overall_score / 100) * 100}% 0, ${(score.overall_score / 100) * 100}% 100%, 0 100%)`
                }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(score.overall_score)}`}>
                {score.overall_score}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(score.last_calculated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('hot')}
                  disabled={score.qualification_status === 'hot'}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Hot
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as hot lead</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('warm')}
                  disabled={score.qualification_status === 'warm'}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Warm
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as warm lead</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('cold')}
                  disabled={score.qualification_status === 'cold'}
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Cold
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as cold lead</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Score Breakdown */}
        {showBreakdown && breakdown && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>Score Breakdown</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              <ScoreBreakdownSection
                title="Demographics"
                score={breakdown.demographic.score}
                maxScore={breakdown.demographic.max}
                factors={breakdown.demographic.factors}
                icon={<Info className="w-4 h-4" />}
              />
              
              <ScoreBreakdownSection
                title="Company Profile"
                score={breakdown.company.score}
                maxScore={breakdown.company.max}
                factors={breakdown.company.factors}
                icon={<Info className="w-4 h-4" />}
              />
              
              <ScoreBreakdownSection
                title="Email Interactions"
                score={breakdown.email_interaction.score}
                maxScore={breakdown.email_interaction.max}
                factors={breakdown.email_interaction.factors}
                icon={<Info className="w-4 h-4" />}
              />
              
              <ScoreBreakdownSection
                title="Behavioral Indicators"
                score={breakdown.behavioral.score}
                maxScore={breakdown.behavioral.max}
                factors={breakdown.behavioral.factors}
                icon={<Info className="w-4 h-4" />}
              />
              
              <ScoreBreakdownSection
                title="Recent Activity"
                score={breakdown.recency.score}
                maxScore={breakdown.recency.max}
                factors={breakdown.recency.factors}
                icon={<Info className="w-4 h-4" />}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Score Metadata */}
        {score.metadata && Object.keys(score.metadata).length > 0 && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <details>
              <summary className="cursor-pointer">Additional Metadata</summary>
              <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto">
                {JSON.stringify(score.metadata, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};