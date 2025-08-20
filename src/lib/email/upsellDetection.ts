/**
 * Upsell Opportunity Detection System
 * Analyzes emails to identify potential revenue opportunities
 */

export interface UpsellOpportunity {
  id: string;
  type: 'product_inquiry' | 'price_question' | 'competitor_mention' | 'expansion_signal' | 'renewal_opportunity';
  confidence: 'high' | 'medium' | 'low';
  potentialValue: number;
  description: string;
  suggestedAction: string;
  keywords: string[];
}

export interface EmailWithUpsell {
  hasUpsellOpportunity: boolean;
  opportunities: UpsellOpportunity[];
  totalPotentialValue: number;
  highestConfidence: 'high' | 'medium' | 'low' | null;
}

// Keywords and patterns for different upsell types
const UPSELL_PATTERNS = {
  product_inquiry: {
    keywords: [
      'looking for', 'need', 'require', 'interested in', 'want to buy',
      'purchase', 'acquire', 'shopping for', 'considering', 'evaluating',
      'quote', 'pricing', 'cost', 'budget', 'proposal'
    ],
    value: 2500,
    confidence: 'high'
  },
  price_question: {
    keywords: [
      'how much', 'price', 'cost', 'budget', 'expensive', 'affordable',
      'discount', 'deal', 'offer', 'special price', 'bulk pricing',
      'volume discount', 'payment terms'
    ],
    value: 1800,
    confidence: 'medium'
  },
  competitor_mention: {
    keywords: [
      'competitor', 'alternative', 'other options', 'comparing',
      'vs', 'versus', 'better than', 'cheaper than', 'similar to',
      'switching from', 'replace', 'upgrade from'
    ],
    value: 3000,
    confidence: 'high'
  },
  expansion_signal: {
    keywords: [
      'growing', 'expanding', 'scaling', 'more locations', 'additional',
      'extra', 'increase', 'upgrade', 'premium', 'enterprise',
      'team is growing', 'hiring', 'new office'
    ],
    value: 4000,
    confidence: 'medium'
  },
  renewal_opportunity: {
    keywords: [
      'contract', 'renewal', 'expire', 'expiring', 'renew',
      'subscription', 'license', 'agreement', 'terms',
      'continue', 'extend', 'long-term'
    ],
    value: 2000,
    confidence: 'high'
  }
};

// High-value signal words that increase potential value
const HIGH_VALUE_SIGNALS = [
  'enterprise', 'corporate', 'company-wide', 'organization',
  'thousand', 'million', 'large scale', 'bulk', 'volume',
  'urgent', 'asap', 'immediately', 'priority'
];

// Confidence boosters
const CONFIDENCE_BOOSTERS = [
  'ready to', 'decision maker', 'approved budget', 'authorized',
  'need this by', 'when can we', 'how quickly', 'timeline'
];

/**
 * Analyzes an email for upsell opportunities
 */
export function analyzeEmailForUpsell(email: {
  subject: string;
  body: string;
  from: string;
}): EmailWithUpsell {
  const emailText = `${email.subject} ${email.body}`.toLowerCase();
  const opportunities: UpsellOpportunity[] = [];

  // Check for each upsell pattern
  Object.entries(UPSELL_PATTERNS).forEach(([type, pattern]) => {
    const matchedKeywords = pattern.keywords.filter(keyword => 
      emailText.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      let confidence = pattern.confidence as 'high' | 'medium' | 'low';
      let potentialValue = pattern.value;

      // Boost confidence if we find confidence boosters
      const confidenceBoosts = CONFIDENCE_BOOSTERS.filter(booster => 
        emailText.includes(booster.toLowerCase())
      ).length;

      if (confidenceBoosts > 0 && confidence === 'medium') {
        confidence = 'high';
      }

      // Increase value if high-value signals are present
      const highValueSignals = HIGH_VALUE_SIGNALS.filter(signal => 
        emailText.includes(signal.toLowerCase())
      ).length;

      if (highValueSignals > 0) {
        potentialValue = Math.round(potentialValue * (1 + highValueSignals * 0.5));
      }

      // Adjust confidence based on number of matching keywords
      if (matchedKeywords.length >= 3 && confidence === 'low') {
        confidence = 'medium';
      }

      const opportunity: UpsellOpportunity = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type as UpsellOpportunity['type'],
        confidence,
        potentialValue,
        description: generateOpportunityDescription(type, matchedKeywords),
        suggestedAction: generateSuggestedAction(type, confidence),
        keywords: matchedKeywords
      };

      opportunities.push(opportunity);
    }
  });

  // Calculate totals
  const totalPotentialValue = opportunities.reduce((sum, opp) => sum + opp.potentialValue, 0);
  const highestConfidence = opportunities.length > 0 
    ? opportunities.reduce((highest, opp) => {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return confidenceOrder[opp.confidence] > confidenceOrder[highest || 'low'] 
          ? opp.confidence 
          : highest;
      }, null as 'high' | 'medium' | 'low' | null)
    : null;

  return {
    hasUpsellOpportunity: opportunities.length > 0,
    opportunities,
    totalPotentialValue,
    highestConfidence
  };
}

function generateOpportunityDescription(type: string, keywords: string[]): string {
  const descriptions = {
    product_inquiry: `Customer showing interest in products/services (${keywords.slice(0, 2).join(', ')})`,
    price_question: `Price inquiry detected - customer evaluating costs (${keywords.slice(0, 2).join(', ')})`,
    competitor_mention: `Competitive evaluation in progress (${keywords.slice(0, 2).join(', ')})`,
    expansion_signal: `Business growth signals detected (${keywords.slice(0, 2).join(', ')})`,
    renewal_opportunity: `Contract/subscription renewal opportunity (${keywords.slice(0, 2).join(', ')})`
  };

  return descriptions[type as keyof typeof descriptions] || 'Upsell opportunity detected';
}

function generateSuggestedAction(type: string, confidence: string): string {
  const actions = {
    product_inquiry: confidence === 'high' 
      ? 'Send detailed product information and schedule demo'
      : 'Follow up with product overview and case studies',
    price_question: confidence === 'high'
      ? 'Provide custom quote and schedule pricing discussion'
      : 'Send pricing guide and offer consultation',
    competitor_mention: confidence === 'high'
      ? 'Schedule competitive analysis call and provide comparison'
      : 'Send competitive advantages document',
    expansion_signal: confidence === 'high'
      ? 'Propose enterprise solutions and schedule growth planning call'
      : 'Share scaling success stories and enterprise features',
    renewal_opportunity: confidence === 'high'
      ? 'Initiate renewal discussion with account manager'
      : 'Send renewal benefits and schedule check-in call'
  };

  return actions[type as keyof typeof actions] || 'Follow up with personalized outreach';
}

/**
 * Gets the appropriate visual indicator for an upsell opportunity
 */
export function getUpsellIndicator(upsell: EmailWithUpsell) {
  if (!upsell.hasUpsellOpportunity) return null;

  const { highestConfidence, totalPotentialValue } = upsell;

  return {
    badge: {
      text: `$${(totalPotentialValue / 1000).toFixed(1)}K potential`,
      variant: highestConfidence === 'high' ? 'success' : 'warning',
      icon: '💰'
    },
    border: {
      color: highestConfidence === 'high' ? '#10B981' : '#F59E0B', // green or amber
      width: '2px'
    },
    priority: highestConfidence === 'high' ? 1 : 2 // for sorting
  };
}

/**
 * Sorts emails by upsell priority
 */
export function sortEmailsByUpsellPriority<T extends { upsellData?: EmailWithUpsell }>(
  emails: T[]
): T[] {
  return emails.sort((a, b) => {
    const aUpsell = a.upsellData;
    const bUpsell = b.upsellData;

    // Emails with upsell opportunities first
    if (aUpsell?.hasUpsellOpportunity && !bUpsell?.hasUpsellOpportunity) return -1;
    if (!aUpsell?.hasUpsellOpportunity && bUpsell?.hasUpsellOpportunity) return 1;

    // If both have upsell opportunities, sort by confidence and value
    if (aUpsell?.hasUpsellOpportunity && bUpsell?.hasUpsellOpportunity) {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const aConfidence = confidenceOrder[aUpsell.highestConfidence || 'low'];
      const bConfidence = confidenceOrder[bUpsell.highestConfidence || 'low'];

      if (aConfidence !== bConfidence) return bConfidence - aConfidence;
      return bUpsell.totalPotentialValue - aUpsell.totalPotentialValue;
    }

    return 0; // Keep original order for emails without upsell opportunities
  });
}
