import { createClient } from '@/lib/supabase/client';

export interface DecisionContext {
  temporal: {
    timeOfDay: number;
    dayOfWeek: number;
    isBusinessHours: boolean;
    contactTimezone: string;
  };
  relational: {
    relationshipStage: string;
    lastInteractionOutcome: string;
    interactionFrequency: string;
    relationshipHealthScore: number;
  };
  business: {
    accountValue: number;
    dealStage: string;
    industryCategory: string;
    companySize: string;
    competitiveContext: any;
  };
  risk: {
    communicationRiskLevel: string;
    businessRiskAssessment: number;
    opportunityRiskAssessment: number;
  };
}

export interface SmartDecision {
  decision_type: string;
  base_confidence: number;
  dynamic_threshold: number;
  context_adjusted_confidence: number;
  executed_automatically: boolean;
  requires_approval: boolean;
  reasoning: string;
  context_factors: DecisionContext;
  risk_assessment: RiskAssessment;
  business_impact_prediction: BusinessImpactPrediction;
  confidence_adjustment: number;
  autonomy_adjustment: string;
}

export interface RiskAssessment {
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risk_factors: string[];
  mitigation_strategies: string[];
  confidence: number;
}

export interface BusinessImpactPrediction {
  potential_value: number;
  success_probability: number;
  time_sensitivity: 'low' | 'medium' | 'high' | 'critical';
  strategic_importance: number;
  resource_requirements: string[];
  expected_outcomes: string[];
}

export class SmartDecisionEngine {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Main decision processing method with context awareness and dynamic thresholds
   */
  async processDecision(
    baseDecision: any,
    email: any,
    contact: any,
    agentAnalysis: any,
    userId: string
  ): Promise<SmartDecision> {
    try {
      // Gather decision context
      const context = await this.gatherDecisionContext(email, contact);
      
      // Calculate dynamic threshold
      const dynamicThreshold = await this.calculateDynamicThreshold(
        baseDecision.decision_type,
        agentAnalysis.agent_type,
        context
      );
      
      // Perform context-aware confidence adjustment
      const adjustedConfidence = this.adjustConfidenceForContext(
        baseDecision.confidence,
        context,
        agentAnalysis
      );
      
      // Assess risk
      const riskAssessment = await this.assessDecisionRisk(
        baseDecision,
        context,
        contact
      );
      
      // Predict business impact
      const businessImpact = await this.predictBusinessImpact(
        baseDecision,
        context,
        agentAnalysis
      );
      
      // Make final autonomy decision
      const autonomyDecision = this.determineAutonomyLevel(
        adjustedConfidence,
        dynamicThreshold,
        riskAssessment,
        businessImpact
      );
      
      // Save context factors to database
      await this.saveDecisionContext(email.id, contact.id, context, userId);
      
      const smartDecision: SmartDecision = {
        decision_type: baseDecision.decision_type,
        base_confidence: baseDecision.confidence,
        dynamic_threshold: dynamicThreshold,
        context_adjusted_confidence: adjustedConfidence,
        executed_automatically: autonomyDecision.executeAutomatically,
        requires_approval: autonomyDecision.requiresApproval,
        reasoning: this.generateAdvancedReasoning(
          baseDecision, context, riskAssessment, businessImpact, autonomyDecision
        ),
        context_factors: context,
        risk_assessment: riskAssessment,
        business_impact_prediction: businessImpact,
        confidence_adjustment: adjustedConfidence - baseDecision.confidence,
        autonomy_adjustment: autonomyDecision.autonomyLevel
      };

      return smartDecision;

    } catch (error) {
      console.error('Smart decision processing failed:', error);
      return this.getDefaultSmartDecision(baseDecision);
    }
  }

  /**
   * Gather comprehensive decision context
   */
  private async gatherDecisionContext(email: any, contact: any): Promise<DecisionContext> {
    const emailDate = new Date(email.created_at || Date.now());
    
    return {
      temporal: {
        timeOfDay: emailDate.getHours(),
        dayOfWeek: emailDate.getDay(),
        isBusinessHours: this.isBusinessHours(emailDate, contact.timezone),
        contactTimezone: contact.timezone || 'UTC'
      },
      relational: {
        relationshipStage: await this.getRelationshipStage(contact.id),
        lastInteractionOutcome: await this.getLastInteractionOutcome(contact.id),
        interactionFrequency: await this.calculateInteractionFrequency(contact.id),
        relationshipHealthScore: await this.calculateRelationshipHealth(contact.id)
      },
      business: {
        accountValue: this.getAccountValue(contact),
        dealStage: await this.getCurrentDealStage(contact.id),
        industryCategory: this.determineIndustryCategory(contact),
        companySize: this.determineCompanySize(contact),
        competitiveContext: await this.getCompetitiveContext(contact.id)
      },
      risk: {
        communicationRiskLevel: this.assessCommunicationRisk(email, contact),
        businessRiskAssessment: await this.calculateBusinessRisk(contact.id),
        opportunityRiskAssessment: await this.calculateOpportunityRisk(contact.id)
      }
    };
  }

  /**
   * Calculate dynamic confidence threshold based on context and agent performance
   */
  private async calculateDynamicThreshold(
    decisionType: string,
    agentType: string,
    context: DecisionContext
  ): Promise<number> {
    // Get agent performance history
    const agentPerformance = await this.getAgentPerformance(agentType);
    
    // Base threshold (conservative starting point)
    let baseThreshold = 0.7;
    
    // Adjust based on agent track record
    if (agentPerformance.successRate > 0.85) {
      baseThreshold -= 0.1; // Lower threshold for high-performing agents
    } else if (agentPerformance.successRate < 0.65) {
      baseThreshold += 0.15; // Higher threshold for underperforming agents
    }
    
    // Context-based adjustments
    const contextAdjustments = this.calculateContextualThresholdAdjustments(context, decisionType);
    
    // Business value adjustments
    const valueAdjustments = this.calculateValueBasedAdjustments(context.business, decisionType);
    
    // Risk-based adjustments
    const riskAdjustments = this.calculateRiskBasedAdjustments(context.risk, decisionType);
    
    const dynamicThreshold = Math.min(0.95, Math.max(0.3, 
      baseThreshold + contextAdjustments + valueAdjustments + riskAdjustments
    ));
    
    return Math.round(dynamicThreshold * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Adjust confidence based on contextual factors
   */
  private adjustConfidenceForContext(
    baseConfidence: number,
    context: DecisionContext,
    agentAnalysis: any
  ): number {
    let adjustment = 0;
    
    // Temporal adjustments
    if (context.temporal.isBusinessHours) {
      adjustment += 0.05; // Slight boost for business hours
    }
    
    // Relational adjustments
    if (context.relational.relationshipStage === 'warm') {
      adjustment += 0.1;
    } else if (context.relational.relationshipStage === 'cold') {
      adjustment -= 0.05;
    }
    
    if (context.relational.relationshipHealthScore > 0.8) {
      adjustment += 0.08;
    } else if (context.relational.relationshipHealthScore < 0.4) {
      adjustment -= 0.1;
    }
    
    // Business value adjustments
    if (context.business.accountValue > 100000) {
      adjustment += 0.05; // Higher confidence for high-value accounts
    } else if (context.business.accountValue > 50000) {
      adjustment += 0.03;
    }
    
    // Deal stage adjustments
    if (context.business.dealStage === 'evaluation' || context.business.dealStage === 'proposal') {
      adjustment += 0.07; // Higher confidence in later stages
    }
    
    // Industry-specific adjustments
    const industryAdjustment = this.getIndustrySpecificAdjustment(
      context.business.industryCategory, 
      agentAnalysis.agent_type
    );
    adjustment += industryAdjustment;
    
    // Risk adjustments
    if (context.risk.communicationRiskLevel === 'low') {
      adjustment += 0.05;
    } else if (context.risk.communicationRiskLevel === 'high') {
      adjustment -= 0.1;
    } else if (context.risk.communicationRiskLevel === 'critical') {
      adjustment -= 0.2;
    }
    
    return Math.min(0.98, Math.max(0.1, baseConfidence + adjustment));
  }

  /**
   * Assess decision-specific risk factors
   */
  private async assessDecisionRisk(
    decision: any,
    context: DecisionContext,
    contact: any
  ): Promise<RiskAssessment> {
    const riskFactors: string[] = [];
    let riskScore = 0.3; // Base risk
    
    // Temporal risk factors
    if (!context.temporal.isBusinessHours) {
      riskFactors.push('Outside business hours - response timing risk');
      riskScore += 0.1;
    }
    
    // Relational risk factors
    if (context.relational.relationshipHealthScore < 0.5) {
      riskFactors.push('Poor relationship health - negative response risk');
      riskScore += 0.2;
    }
    
    if (context.relational.lastInteractionOutcome === 'negative') {
      riskFactors.push('Last interaction was negative - compounding risk');
      riskScore += 0.15;
    }
    
    // Business risk factors
    if (context.business.accountValue > 100000) {
      riskFactors.push('High-value account - reputational risk');
      riskScore += 0.1;
    }
    
    if (context.business.competitiveContext?.activeCompetitors?.length > 0) {
      riskFactors.push('Active competitive situation - strategic risk');
      riskScore += 0.1;
    }
    
    // Decision-specific risk factors
    const decisionRiskFactors = this.getDecisionSpecificRisks(decision.decision_type, context);
    riskFactors.push(...decisionRiskFactors.factors);
    riskScore += decisionRiskFactors.score;
    
    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 0.8) riskLevel = 'critical';
    else if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.4) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Generate mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(riskFactors, riskLevel);
    
    return {
      overall_risk_level: riskLevel,
      risk_score: Math.min(0.95, riskScore),
      risk_factors: riskFactors,
      mitigation_strategies: mitigationStrategies,
      confidence: riskFactors.length > 0 ? 0.8 : 0.6
    };
  }

  /**
   * Predict business impact of the decision
   */
  private async predictBusinessImpact(
    decision: any,
    context: DecisionContext,
    agentAnalysis: any
  ): Promise<BusinessImpactPrediction> {
    // Base potential value calculation
    let potentialValue = context.business.accountValue * 0.1; // 10% of account value
    
    // Adjust based on decision type
    const decisionMultiplier = this.getDecisionValueMultiplier(decision.decision_type);
    potentialValue *= decisionMultiplier;
    
    // Success probability calculation
    let successProbability = 0.6; // Base probability
    
    // Adjust based on relationship health
    if (context.relational.relationshipHealthScore > 0.8) {
      successProbability += 0.2;
    } else if (context.relational.relationshipHealthScore < 0.4) {
      successProbability -= 0.2;
    }
    
    // Adjust based on deal stage
    if (context.business.dealStage === 'proposal' || context.business.dealStage === 'negotiation') {
      successProbability += 0.15;
    }
    
    // Time sensitivity assessment
    const timeSensitivity = this.assessTimeSensitivity(decision, context, agentAnalysis);
    
    // Strategic importance calculation
    const strategicImportance = this.calculateStrategicImportance(context.business);
    
    // Resource requirements
    const resourceRequirements = this.identifyResourceRequirements(decision.decision_type);
    
    // Expected outcomes
    const expectedOutcomes = this.predictExpectedOutcomes(decision, context, successProbability);
    
    return {
      potential_value: Math.round(potentialValue),
      success_probability: Math.min(0.95, Math.max(0.05, successProbability)),
      time_sensitivity: timeSensitivity,
      strategic_importance: strategicImportance,
      resource_requirements: resourceRequirements,
      expected_outcomes: expectedOutcomes
    };
  }

  /**
   * Determine final autonomy level based on all factors
   */
  private determineAutonomyLevel(
    adjustedConfidence: number,
    dynamicThreshold: number,
    riskAssessment: RiskAssessment,
    businessImpact: BusinessImpactPrediction
  ) {
    let executeAutomatically = false;
    let requiresApproval = true;
    let autonomyLevel = 'manual_approval';
    
    // Primary decision based on confidence vs threshold
    if (adjustedConfidence >= dynamicThreshold) {
      // Passed threshold - check additional constraints
      
      // Risk constraint
      if (riskAssessment.overall_risk_level === 'critical') {
        autonomyLevel = 'manual_approval';
        requiresApproval = true;
      } else if (riskAssessment.overall_risk_level === 'high') {
        autonomyLevel = 'supervised_execution';
        requiresApproval = true;
      } else {
        // Low-medium risk - check business impact
        if (businessImpact.potential_value > 50000 || businessImpact.strategic_importance > 0.8) {
          autonomyLevel = 'executive_approval';
          requiresApproval = true;
        } else if (businessImpact.time_sensitivity === 'critical' && riskAssessment.overall_risk_level === 'low') {
          autonomyLevel = 'autonomous_execution';
          executeAutomatically = true;
          requiresApproval = false;
        } else {
          autonomyLevel = 'supervised_execution';
          requiresApproval = true;
        }
      }
    } else {
      // Below threshold
      autonomyLevel = 'manual_approval';
      requiresApproval = true;
    }
    
    return {
      executeAutomatically,
      requiresApproval,
      autonomyLevel
    };
  }

  /**
   * Generate comprehensive reasoning for the decision
   */
  private generateAdvancedReasoning(
    baseDecision: any,
    context: DecisionContext,
    riskAssessment: RiskAssessment,
    businessImpact: BusinessImpactPrediction,
    autonomyDecision: any
  ): string {
    const reasoningParts = [];
    
    // Base confidence reasoning
    reasoningParts.push(`Base confidence: ${(baseDecision.confidence * 100).toFixed(0)}% for ${baseDecision.decision_type}`);
    
    // Context adjustments
    if (context.relational.relationshipStage === 'warm') {
      reasoningParts.push('Relationship is warm - increased confidence');
    }
    if (context.business.accountValue > 50000) {
      reasoningParts.push(`High-value account ($${context.business.accountValue.toLocaleString()}) - strategic importance`);
    }
    if (context.temporal.isBusinessHours) {
      reasoningParts.push('Within business hours - optimal timing');
    }
    
    // Risk considerations
    if (riskAssessment.overall_risk_level !== 'low') {
      reasoningParts.push(`${riskAssessment.overall_risk_level} risk level identified - caution warranted`);
    }
    
    // Business impact
    if (businessImpact.success_probability > 0.7) {
      reasoningParts.push(`High success probability (${(businessImpact.success_probability * 100).toFixed(0)}%)`);
    }
    
    // Final decision reasoning
    reasoningParts.push(`Final decision: ${autonomyDecision.autonomyLevel}`);
    
    return reasoningParts.join('. ') + '.';
  }

  // Helper methods for context gathering and calculations...

  private isBusinessHours(date: Date, timezone: string = 'UTC'): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    
    // Assume business hours: Monday-Friday, 8 AM - 6 PM
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  }

  private async getRelationshipStage(contactId: string): Promise<string> {
    const { data } = await this.supabase
      .from('contact_analysis_history')
      .select('relationship_stage')
      .eq('contact_id', contactId)
      .not('relationship_stage', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    return data?.[0]?.relationship_stage || 'new';
  }

  private async getLastInteractionOutcome(contactId: string): Promise<string> {
    // Simplified - would analyze actual interaction outcomes
    return 'neutral';
  }

  private async calculateInteractionFrequency(contactId: string): Promise<string> {
    const { data } = await this.supabase
      .from('email_queue')
      .select('created_at')
      .eq('contact_id', contactId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    const count = data?.length || 0;
    if (count > 10) return 'frequent';
    if (count > 5) return 'regular';
    if (count > 2) return 'occasional';
    return 'rare';
  }

  private async calculateRelationshipHealth(contactId: string): Promise<number> {
    // Simplified relationship health calculation
    return 0.7;
  }

  private getAccountValue(contact: any): number {
    return contact.account_value || contact.company_data?.estimated_revenue || 10000;
  }

  private async getCurrentDealStage(contactId: string): Promise<string> {
    // Simplified - would get from actual deal/opportunity data
    return 'qualification';
  }

  private determineIndustryCategory(contact: any): string {
    return contact.industry || contact.company_data?.industry || 'general';
  }

  private determineCompanySize(contact: any): string {
    const employees = contact.company_data?.employees || 50;
    if (employees > 1000) return 'enterprise';
    if (employees > 100) return 'mid-market';
    return 'small-business';
  }

  private async getCompetitiveContext(contactId: string): Promise<any> {
    return { activeCompetitors: [] };
  }

  private assessCommunicationRisk(email: any, contact: any): string {
    // Risk assessment based on email content and contact history
    const content = email.content || email.body || '';
    if (content.includes('urgent') || content.includes('problem')) return 'medium';
    return 'low';
  }

  private async calculateBusinessRisk(contactId: string): Promise<number> {
    return 0.3; // Simplified business risk calculation
  }

  private async calculateOpportunityRisk(contactId: string): Promise<number> {
    return 0.25; // Simplified opportunity risk calculation
  }

  private async getAgentPerformance(agentType: string) {
    const { data } = await this.supabase
      .from('agent_performance_metrics')
      .select('success_rate, average_confidence')
      .eq('agent_type', agentType)
      .order('created_at', { ascending: false })
      .limit(1);
    
    return {
      successRate: data?.[0]?.success_rate || 0.7,
      averageConfidence: data?.[0]?.average_confidence || 0.6
    };
  }

  private calculateContextualThresholdAdjustments(context: DecisionContext, decisionType: string): number {
    let adjustment = 0;
    
    if (context.temporal.isBusinessHours) adjustment -= 0.05;
    if (context.relational.relationshipHealthScore > 0.8) adjustment -= 0.1;
    
    return adjustment;
  }

  private calculateValueBasedAdjustments(business: DecisionContext['business'], decisionType: string): number {
    let adjustment = 0;
    
    if (business.accountValue > 100000) adjustment -= 0.05;
    if (business.dealStage === 'evaluation') adjustment -= 0.05;
    
    return adjustment;
  }

  private calculateRiskBasedAdjustments(risk: DecisionContext['risk'], decisionType: string): number {
    let adjustment = 0;
    
    if (risk.communicationRiskLevel === 'high') adjustment += 0.15;
    if (risk.communicationRiskLevel === 'critical') adjustment += 0.25;
    
    return adjustment;
  }

  private getIndustrySpecificAdjustment(industry: string, agentType: string): number {
    // Industry-specific confidence adjustments
    if (industry === 'healthcare' && agentType === 'sales') return 0.05;
    if (industry === 'technology' && agentType === 'product') return 0.08;
    return 0;
  }

  private getDecisionSpecificRisks(decisionType: string, context: DecisionContext): { factors: string[], score: number } {
    const factors: string[] = [];
    let score = 0;
    
    switch (decisionType) {
      case 'auto_response':
        if (context.relational.relationshipStage === 'cold') {
          factors.push('Cold relationship - automated response may seem impersonal');
          score += 0.1;
        }
        break;
      case 'sales_followup':
        if (context.business.competitiveContext?.activeCompetitors?.length > 0) {
          factors.push('Competitive situation - aggressive followup risk');
          score += 0.15;
        }
        break;
    }
    
    return { factors, score };
  }

  private generateMitigationStrategies(riskFactors: string[], riskLevel: string): string[] {
    const strategies: string[] = [];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      strategies.push('Require senior approval before execution');
      strategies.push('Add human review checkpoint');
    }
    
    if (riskFactors.some(f => f.includes('relationship'))) {
      strategies.push('Personalize communication approach');
      strategies.push('Reference previous positive interactions');
    }
    
    if (riskFactors.some(f => f.includes('competitive'))) {
      strategies.push('Highlight unique value proposition');
      strategies.push('Address competitive concerns proactively');
    }
    
    return strategies;
  }

  private getDecisionValueMultiplier(decisionType: string): number {
    switch (decisionType) {
      case 'sales_followup': return 0.3;
      case 'proposal_request': return 0.8;
      case 'meeting_request': return 0.2;
      case 'auto_response': return 0.05;
      default: return 0.1;
    }
  }

  private assessTimeSensitivity(decision: any, context: DecisionContext, agentAnalysis: any): 'low' | 'medium' | 'high' | 'critical' {
    if (decision.decision_type === 'urgent_response') return 'critical';
    if (context.business.dealStage === 'proposal') return 'high';
    if (context.relational.interactionFrequency === 'frequent') return 'medium';
    return 'low';
  }

  private calculateStrategicImportance(business: DecisionContext['business']): number {
    let importance = 0.5; // Base importance
    
    if (business.accountValue > 100000) importance += 0.3;
    if (business.dealStage === 'evaluation' || business.dealStage === 'proposal') importance += 0.2;
    if (business.companySize === 'enterprise') importance += 0.15;
    
    return Math.min(1, importance);
  }

  private identifyResourceRequirements(decisionType: string): string[] {
    const requirements: string[] = [];
    
    switch (decisionType) {
      case 'proposal_request':
        requirements.push('Sales team time', 'Proposal template', 'Pricing information');
        break;
      case 'technical_demo':
        requirements.push('Technical team availability', 'Demo environment', 'Product expertise');
        break;
      default:
        requirements.push('Minimal resources required');
    }
    
    return requirements;
  }

  private predictExpectedOutcomes(decision: any, context: DecisionContext, successProbability: number): string[] {
    const outcomes: string[] = [];
    
    if (successProbability > 0.7) {
      outcomes.push('Positive customer response expected');
      outcomes.push('Relationship advancement likely');
    }
    
    if (context.business.dealStage === 'evaluation') {
      outcomes.push('May accelerate deal progression');
    }
    
    outcomes.push(`${(successProbability * 100).toFixed(0)}% probability of achieving desired outcome`);
    
    return outcomes;
  }

  private async saveDecisionContext(emailId: string, contactId: string, context: DecisionContext, userId: string) {
    const { error } = await this.supabase
      .from('decision_context_factors')
      .insert({
        email_id: emailId,
        contact_id: contactId,
        email_time_of_day: context.temporal.timeOfDay,
        email_day_of_week: context.temporal.dayOfWeek,
        is_business_hours: context.temporal.isBusinessHours,
        contact_timezone: context.temporal.contactTimezone,
        relationship_stage: context.relational.relationshipStage,
        last_interaction_outcome: context.relational.lastInteractionOutcome,
        interaction_frequency: context.relational.interactionFrequency,
        relationship_health_score: context.relational.relationshipHealthScore,
        account_value: context.business.accountValue,
        deal_stage: context.business.dealStage,
        industry_category: context.business.industryCategory,
        company_size: context.business.companySize,
        competitive_context: context.business.competitiveContext,
        communication_risk_level: context.risk.communicationRiskLevel,
        business_risk_assessment: context.risk.businessRiskAssessment,
        opportunity_risk_assessment: context.risk.opportunityRiskAssessment,
        user_id: userId
      });

    if (error) {
      console.error('Error saving decision context:', error);
    }
  }

  private getDefaultSmartDecision(baseDecision: any): SmartDecision {
    return {
      decision_type: baseDecision.decision_type,
      base_confidence: baseDecision.confidence,
      dynamic_threshold: 0.7,
      context_adjusted_confidence: baseDecision.confidence,
      executed_automatically: false,
      requires_approval: true,
      reasoning: 'Default decision processing - manual approval required',
      context_factors: {} as DecisionContext,
      risk_assessment: {
        overall_risk_level: 'medium',
        risk_score: 0.5,
        risk_factors: [],
        mitigation_strategies: [],
        confidence: 0.3
      },
      business_impact_prediction: {
        potential_value: 0,
        success_probability: 0.5,
        time_sensitivity: 'low',
        strategic_importance: 0.5,
        resource_requirements: [],
        expected_outcomes: []
      },
      confidence_adjustment: 0,
      autonomy_adjustment: 'manual_approval'
    };
  }
} 