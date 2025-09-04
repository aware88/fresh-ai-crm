/**
 * Opportunity Card Component
 * Draggable card for opportunities in pipeline view
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreVertical,
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import type { OpportunityWithDetails } from '@/types/pipeline';

interface OpportunityCardProps {
  opportunity: OpportunityWithDetails;
  isDragging?: boolean;
  onEdit?: (opportunity: OpportunityWithDetails) => void;
  onView?: (opportunity: OpportunityWithDetails) => void;
  onDelete?: (opportunityId: string) => void;
  onEmailContact?: (contactEmail: string) => void;
  onCallContact?: (contactPhone: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500 hover:bg-red-600';
    case 'high': return 'bg-orange-500 hover:bg-orange-600';
    case 'medium': return 'bg-blue-500 hover:bg-blue-600';
    case 'low': return 'bg-gray-500 hover:bg-gray-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

const formatCurrency = (value?: number, currency = 'USD') => {
  if (!value) return 'No value';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getLeadScoreColor = (score?: number) => {
  if (!score) return 'text-gray-500';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isDragging = false,
  onEdit,
  onView,
  onDelete,
  onEmailContact,
  onCallContact
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: opportunity.id,
      type: 'opportunity',
      opportunity,
      sourceStageId: opportunity.stage_id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.dataTransfer.clearData();
  };

  return (
    <Card 
      className={`
        w-full mb-3 cursor-move transition-all duration-200 hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2 scale-95' : 'hover:scale-[1.02]'}
        border-l-4 ${opportunity.priority === 'urgent' ? 'border-l-red-500' : 
                     opportunity.priority === 'high' ? 'border-l-orange-500' :
                     opportunity.priority === 'medium' ? 'border-l-blue-500' : 'border-l-gray-400'}
      `}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" title={opportunity.title}>
              {opportunity.title}
            </h3>
            {opportunity.contact && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground truncate">
                  {opportunity.contact.firstname} {opportunity.contact.lastname}
                </span>
                {opportunity.contact.company && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {opportunity.contact.company}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView?.(opportunity)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(opportunity)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {opportunity.contact?.email && (
                <DropdownMenuItem onClick={() => onEmailContact?.(opportunity.contact!.email)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
              )}
              {opportunity.contact && (
                <DropdownMenuItem onClick={() => onCallContact?.('phone')}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Contact
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete?.(opportunity.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Value and Probability */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">
                {formatCurrency(opportunity.value, opportunity.currency)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="h-3 w-3" />
              <span>{opportunity.probability}%</span>
            </div>
          </div>

          {/* Lead Score */}
          {opportunity.lead_score && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Lead Score:</span>
              <span className={`font-medium ${getLeadScoreColor(opportunity.lead_score.overall_score)}`}>
                {opportunity.lead_score.overall_score}/100
              </span>
            </div>
          )}

          {/* Priority Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              className={`text-xs text-white ${getPriorityColor(opportunity.priority)}`}
            >
              {opportunity.priority.charAt(0).toUpperCase() + opportunity.priority.slice(1)} Priority
            </Badge>
            
            {/* Close Date */}
            {opportunity.expected_close_date && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(opportunity.expected_close_date)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected close date</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Assigned User */}
          {opportunity.assigned_user && (
            <div className="flex items-center gap-2 text-xs">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">
                  {opportunity.assigned_user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground truncate">
                Assigned to {opportunity.assigned_user.name || opportunity.assigned_user.email}
              </span>
            </div>
          )}

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {opportunity.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {opportunity.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{opportunity.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Activity Indicator */}
          {opportunity.activity_count && opportunity.activity_count > 0 && (
            <div className="text-xs text-muted-foreground">
              {opportunity.activity_count} recent activit{opportunity.activity_count === 1 ? 'y' : 'ies'}
            </div>
          )}

          {/* Last Activity */}
          <div className="text-xs text-muted-foreground">
            Last activity: {formatDate(opportunity.last_activity_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};