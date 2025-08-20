import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { EmailWithUpsell, UpsellOpportunity } from '@/lib/email/upsellDetection';

interface UpsellIndicatorProps {
  upsellData: EmailWithUpsell;
  emailId: string;
  onCreateFollowUp?: (emailId: string, opportunity: UpsellOpportunity) => void;
  onMarkPursued?: (emailId: string, opportunityId: string) => void;
  compact?: boolean;
}

const OPPORTUNITY_ICONS = {
  product_inquiry: '🛍️',
  price_question: '💰',
  competitor_mention: '⚔️',
  expansion_signal: '📈',
  renewal_opportunity: '🔄'
};

const OPPORTUNITY_COLORS = {
  product_inquiry: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  price_question: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  competitor_mention: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  expansion_signal: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  renewal_opportunity: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' }
};

export function UpsellIndicator({ 
  upsellData, 
  emailId, 
  onCreateFollowUp, 
  onMarkPursued,
  compact = false 
}: UpsellIndicatorProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!upsellData.hasUpsellOpportunity) return null;

  const { opportunities, totalPotentialValue, highestConfidence } = upsellData;
  const topOpportunity = opportunities.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  })[0];

  const confidenceColor = {
    high: 'text-green-600',
    medium: 'text-amber-600', 
    low: 'text-gray-600'
  }[highestConfidence || 'low'];

  const confidenceBg = {
    high: 'bg-green-50 border-green-200',
    medium: 'bg-amber-50 border-amber-200',
    low: 'bg-gray-50 border-gray-200'
  }[highestConfidence || 'low'];

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <Badge 
          variant="outline" 
          className={`text-xs px-2 py-0.5 h-5 ${confidenceBg} ${confidenceColor} border`}
        >
          💰 ${(totalPotentialValue / 1000).toFixed(1)}K
        </Badge>
        {opportunities.length > 1 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
            +{opportunities.length - 1}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main Upsell Badge */}
      <div className={`flex items-center justify-between p-2 rounded-lg border ${confidenceBg}`}>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Sparkles className={`h-3 w-3 ${confidenceColor}`} />
            <span className={`text-xs font-medium ${confidenceColor}`}>
              Upsell Opportunity
            </span>
          </div>
          <Badge variant="outline" className={`text-xs ${confidenceColor}`}>
            ${(totalPotentialValue / 1000).toFixed(1)}K potential
          </Badge>
        </div>
        
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Upsell Opportunities Detected</span>
              </DialogTitle>
              <DialogDescription>
                AI has identified {opportunities.length} potential revenue opportunity{opportunities.length > 1 ? 'ies' : 'y'} in this email
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {opportunities.map((opportunity, index) => {
                const colors = OPPORTUNITY_COLORS[opportunity.type];
                const icon = OPPORTUNITY_ICONS[opportunity.type];
                
                return (
                  <Card key={opportunity.id} className={`border ${colors.border}`}>
                    <CardHeader className={`pb-3 ${colors.bg}`}>
                      <CardTitle className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{icon}</span>
                          <span className={colors.text}>
                            {opportunity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={opportunity.confidence === 'high' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {opportunity.confidence} confidence
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ${(opportunity.potentialValue / 1000).toFixed(1)}K
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="text-sm text-gray-700 mb-3">
                        {opportunity.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <strong>Suggested action:</strong> {opportunity.suggestedAction}
                        </div>
                        <div className="flex space-x-2">
                          {onCreateFollowUp && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onCreateFollowUp(emailId, opportunity)}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Create Follow-up
                            </Button>
                          )}
                          {onMarkPursued && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => onMarkPursued(emailId, opportunity.id)}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Mark Pursued
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                <strong>Total Potential Value:</strong> ${totalPotentialValue.toLocaleString()}
              </div>
              <Button onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions for High Confidence Opportunities */}
      {highestConfidence === 'high' && onCreateFollowUp && (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-6"
            onClick={() => onCreateFollowUp(emailId, topOpportunity)}
          >
            <Clock className="h-3 w-3 mr-1" />
            Quick Follow-up
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-xs h-6"
            onClick={() => setIsDetailsOpen(true)}
          >
            View Details
          </Button>
        </div>
      )}
    </div>
  );
}

export function UpsellBadge({ 
  upsellData, 
  onClick 
}: { 
  upsellData: EmailWithUpsell; 
  onClick?: () => void;
}) {
  if (!upsellData.hasUpsellOpportunity) return null;

  const { totalPotentialValue, highestConfidence } = upsellData;
  
  const confidenceColor = {
    high: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-gray-100 text-gray-800 border-gray-300'
  }[highestConfidence || 'low'];

  return (
    <Badge 
      variant="outline" 
      className={`text-xs px-2 py-0.5 cursor-pointer hover:shadow-sm transition-shadow ${confidenceColor}`}
      onClick={onClick}
    >
      💰 ${(totalPotentialValue / 1000).toFixed(1)}K opportunity
    </Badge>
  );
}
