/**
 * Pipeline Stage Component
 * Drop zone for opportunities in pipeline view
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, TrendingUp, DollarSign } from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';
import type { StageWithOpportunities, OpportunityWithDetails } from '@/types/pipeline';

interface PipelineStageProps {
  stage: StageWithOpportunities;
  onOpportunityMove?: (opportunityId: string, targetStageId: string) => void;
  onOpportunityEdit?: (opportunity: OpportunityWithDetails) => void;
  onOpportunityView?: (opportunity: OpportunityWithDetails) => void;
  onOpportunityDelete?: (opportunityId: string) => void;
  onAddOpportunity?: (stageId: string) => void;
  onEditStage?: (stageId: string) => void;
  onEmailContact?: (contactEmail: string) => void;
  onCallContact?: (contactPhone: string) => void;
}

const formatCurrency = (value: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PipelineStage: React.FC<PipelineStageProps> = ({
  stage,
  onOpportunityMove,
  onOpportunityEdit,
  onOpportunityView,
  onOpportunityDelete,
  onAddOpportunity,
  onEditStage,
  onEmailContact,
  onCallContact
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedOpportunityId, setDraggedOpportunityId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'opportunity' && data.id !== draggedOpportunityId) {
        if (data.sourceStageId !== stage.id) {
          onOpportunityMove?.(data.id, stage.id);
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
    
    setDraggedOpportunityId(null);
  };

  const handleDragStart = (opportunityId: string) => {
    setDraggedOpportunityId(opportunityId);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <CardTitle className="text-lg font-semibold">
                {stage.name}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stage.opportunities_count}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onAddOpportunity?.(stage.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditStage?.(stage.id)}>
                    Edit Stage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddOpportunity?.(stage.id)}>
                    Add Opportunity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stage Statistics */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(stage.total_value)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{stage.probability}% avg</span>
            </div>
          </div>

          {stage.description && (
            <p className="text-xs text-muted-foreground">
              {stage.description}
            </p>
          )}
        </CardHeader>

        <CardContent 
          className={`
            flex-1 overflow-y-auto p-3 pt-0 min-h-[400px] transition-colors
            ${isDragOver ? 'bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 border-dashed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {stage.opportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <div className="text-sm mb-2">No opportunities</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAddOpportunity?.(stage.id)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add First Opportunity
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stage.opportunities
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((opportunity) => (
                  <div
                    key={opportunity.id}
                    onDragStart={() => handleDragStart(opportunity.id)}
                  >
                    <OpportunityCard
                      opportunity={opportunity}
                      isDragging={draggedOpportunityId === opportunity.id}
                      onEdit={onOpportunityEdit}
                      onView={onOpportunityView}
                      onDelete={onOpportunityDelete}
                      onEmailContact={onEmailContact}
                      onCallContact={onCallContact}
                    />
                  </div>
                ))
              }
            </div>
          )}

          {/* Drop zone indicator */}
          {isDragOver && (
            <div className="mt-4 p-4 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Drop opportunity here to move to {stage.name}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};