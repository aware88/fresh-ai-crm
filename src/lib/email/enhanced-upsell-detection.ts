/**
 * Enhanced Upsell Opportunity Detection System
 * Combines intelligent AI-based calculation with pattern-based fallback
 */

import { calculateIntelligentOpportunity, type OpportunityCalculation } from './intelligent-opportunity-calculator';

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
  intelligentCalculation?: OpportunityCalculation;
}

// No more legacy patterns - only intelligent calculation

/**
 * Enhanced email analysis using intelligent calculation only
 */
export async function analyzeEmailForUpsell(email: {
  subject: string;
  body: string;
  from: string;
  organizationId?: string;
}): Promise<EmailWithUpsell> {
  try {
    console.log('Starting intelligent opportunity analysis...');
    
    // Try intelligent opportunity calculation first
    const intelligentResult = await calculateIntelligentOpportunity(email);
    
    if (intelligentResult.hasUpsellOpportunity && intelligentResult.calculation) {
      console.log('Intelligent calculation successful, total value:', intelligentResult.calculation.totalOpportunityValue);
      
      // Convert intelligent calculation to legacy format for compatibility
      const opportunities: UpsellOpportunity[] = intelligentResult.calculation.breakdown
        .filter(item => item.totalValue && item.totalValue > 0)
        .map((item, index) => ({
          id: `intelligent_${Date.now()}_${index}`,
          type: 'product_inquiry' as UpsellOpportunity['type'],
          confidence: item.confidence >= 0.8 ? 'high' : item.confidence >= 0.5 ? 'medium' : 'low',
          potentialValue: Math.round(item.totalValue || 0),
          description: `${item.productName}${item.requestedQuantity ? ` (${item.requestedQuantity}${item.unit || ''})` : ''} - ${item.priceSource} pricing`,
          suggestedAction: `Follow up on ${item.productName} inquiry with detailed quote`,
          keywords: [item.productName]
        }));

      return {
        hasUpsellOpportunity: true,
        opportunities,
        totalPotentialValue: Math.round(intelligentResult.calculation.totalOpportunityValue),
        highestConfidence: intelligentResult.calculation.confidence,
        intelligentCalculation: intelligentResult.calculation
      };
    }
  } catch (error) {
    console.warn('Intelligent opportunity calculation failed, no opportunity will be shown:', error);
  }

  console.log('Intelligent calculation failed, showing no opportunity');
  // No fallback - if intelligent calculation fails, show no opportunity
  return {
    hasUpsellOpportunity: false,
    opportunities: [],
    totalPotentialValue: 0,
    highestConfidence: null
  };
}

// Legacy functions removed - only intelligent calculation is used

// Re-export types for compatibility
export type { OpportunityCalculation } from './intelligent-opportunity-calculator';
