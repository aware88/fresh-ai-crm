/**
 * Email Color Legend Component
 * Shows a tooltip explaining the email highlighting system
 */

import React, { useState } from 'react';
import { HelpCircle, User, DollarSign, AlertTriangle, CreditCard, Bot } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ColorItem {
  color: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  priority: number;
}

const colorLegend: ColorItem[] = [
  {
    color: '#EF4444',
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Dispute',
    description: 'Complaints, refunds, urgent issues',
    priority: 1
  },
  {
    color: '#10B981',
    icon: <DollarSign className="h-4 w-4" />,
    label: 'Sales/Opportunity',
    description: 'Sales inquiries, high-value opportunities',
    priority: 2
  },
  {
    color: '#8B5CF6',
    icon: <CreditCard className="h-4 w-4" />,
    label: 'Billing',
    description: 'Payment issues, invoice questions',
    priority: 3
  },
  {
    color: '#3B82F6',
    icon: <User className="h-4 w-4" />,
    label: 'Customer Support',
    description: 'Technical help, general inquiries',
    priority: 4
  },
  {
    color: '#F59E0B',
    icon: <DollarSign className="h-4 w-4" />,
    label: 'Medium Opportunity',
    description: 'Potential sales opportunities €1K-€5K',
    priority: 5
  },
  {
    color: '#6B7280',
    icon: <Bot className="h-4 w-4" />,
    label: 'Auto-Reply',
    description: 'Simple questions, routine emails',
    priority: 6
  }
];

export function EmailColorLegend() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0 max-w-sm">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Email Color Guide</CardTitle>
              <p className="text-xs text-muted-foreground">
                Left border colors indicate email priority and type
              </p>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {colorLegend.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-8 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-gray-600">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-gray-900">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Priority Order:</div>
                  <div>1. Selected email (blue)</div>
                  <div>2. Highlighted emails (by priority)</div>
                  <div>3. Regular emails (by date)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact version for smaller spaces
 */
export function EmailColorLegendCompact() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HelpCircle className="h-3 w-3" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50">
          <Card className="w-64 shadow-lg border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                Email Colors
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {colorLegend.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-4 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="text-xs">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-500 ml-1">- {item.description.split(',')[0]}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
