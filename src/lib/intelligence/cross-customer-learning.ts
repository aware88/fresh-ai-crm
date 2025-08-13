/**
 * Cross-Customer Learning (Phase 2)
 *
 * Discovers anonymized patterns across customers and recommends winning approaches.
 */

export type SuccessPattern = {
  id: string;
  description: string;
  successRate: number; // 0-1
  applicableConditions: string[];
  recommendedActions: string[];
  confidence: number; // 0-1
};

export type ApproachRecommendation = {
  patternId: string;
  recommendation: string;
  expectedImpact: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  rationale: string[];
};

export class CrossCustomerLearning {
  /**
   * Identify success patterns (placeholder: rule-based summary)
   */
  identifySuccessPatterns(params?: { industry?: string; companySize?: string }): SuccessPattern[] {
    // Placeholder patterns; replace with real mining pipeline
    return [
      {
        id: 'p1',
        description: 'Short cycles: schedule call within 12h when engagement rising',
        successRate: 0.68,
        applicableConditions: ['increasing_engagement', 'opportunityScore>=70'],
        recommendedActions: ['schedule_call', 'proposal_in_48h'],
        confidence: 0.7
      },
      {
        id: 'p2',
        description: 'Decreasing engagement: share 2 peer case studies to recover interest',
        successRate: 0.54,
        applicableConditions: ['decreasing_engagement'],
        recommendedActions: ['share_case_study', 'followup_in_24h'],
        confidence: 0.6
      }
    ];
  }

  /**
   * Match a context to the best pattern and generate a recommendation
   */
  recommendApproach(
    context: { evolution: string; opportunityScore?: number; industry?: string }
  ): ApproachRecommendation | null {
    const patterns = this.identifySuccessPatterns({ industry: context.industry });

    // Simple match logic for now
    const candidate = patterns.find(p => p.applicableConditions.includes(context.evolution));
    if (!candidate) return null;

    const probability = Math.min(0.9, candidate.successRate + (context.opportunityScore || 0) / 300);

    return {
      patternId: candidate.id,
      recommendation: candidate.recommendedActions.join(', '),
      expectedImpact: candidate.successRate > 0.6 ? 'high' : 'medium',
      probability,
      rationale: ['matched_pattern', 'industry_baseline']
    };
  }
}

export const crossCustomerLearning = new CrossCustomerLearning();
