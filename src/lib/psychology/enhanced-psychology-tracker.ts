/**
 * Enhanced Psychology Evolution Tracker
 * 
 * Monitors and tracks how contact psychology evolves over time,
 * integrating with your existing 21+ psychological profiling fields.
 */

import { createServerClient } from '@/lib/supabase/server';
import { interAgentCommunication } from '../agents/inter-agent-communication';
import { AgentType } from '../agents/autonomous-orchestrator';
import { v4 as uuidv4 } from 'uuid';

export interface PsychologyProfile {
  personality_type?: string;
  traits?: string[];
  communication_style?: string;
  decision_making_style?: string;
  emotional_triggers?: string[];
  cognitive_biases?: string[];
  stress_response?: string;
  cultural_tone?: string;
  reading_style?: string;
  tone_preference?: string;
  risk_tolerance?: number; // 0-1 scale
  urgency_sensitivity?: number; // 0-1 scale
  authority_deference?: number; // 0-1 scale
  social_proof_influence?: number; // 0-1 scale
  relationship_orientation?: 'task' | 'relationship' | 'balanced';
  information_processing?: 'analytical' | 'intuitive' | 'mixed';
  lead_score?: number;
  conversion_likelihood?: string;
  estimated_deal_tier?: string;
}

export interface PsychologyEvolutionEvent {
  id: string;
  contactId: string;
  organizationId: string;
  previousProfile: PsychologyProfile;
  currentProfile: PsychologyProfile;
  evolutionType: 'personality_shift' | 'buying_intent_change' | 'relationship_upgrade' | 'behavioral_change';
  confidence: number;
  insights: string[];
  recommendedActions: string[];
  triggers: EvolutionTrigger[];
  businessImpact: BusinessImpactAssessment;
  detectedBy: AgentType;
  emailTriggerId?: string;
  timestamp: Date;
}

export interface EvolutionTrigger {
  type: 'email_content' | 'response_pattern' | 'engagement_change' | 'external_event';
  description: string;
  evidence: string[];
  significance: number; // 0-1 scale
}

export interface BusinessImpactAssessment {
  opportunityScore: number; // 0-1 scale
  riskLevel: 'low' | 'medium' | 'high';
  revenueImpact: number; // Estimated $ impact
  relationshipHealth: number; // 0-1 scale
  actionUrgency: 'low' | 'medium' | 'high' | 'critical';
  strategicImportance: number; // 0-1 scale
}

export interface PredictedEvolution {
  contactId: string;
  predictedChanges: PsychologyProfile;
  probability: number;
  timeframe: string; // e.g., "next 7 days", "within 2 weeks"
  influencingFactors: string[];
  recommendedInterventions: string[];
  confidenceLevel: number;
}

export class EnhancedPsychologyTracker {
  private supabase: any;

  constructor() {
    this.supabase = createServerClient();
  }

  /**
   * Track psychology evolution from new email analysis
   */
  async trackEvolutionFromEmail(
    contactId: string,
    organizationId: string,
    newAnalysis: PsychologyProfile,
    emailId: string,
    detectedBy: AgentType
  ): Promise<PsychologyEvolutionEvent | null> {
    try {
      // Get the most recent psychology analysis for comparison
      const previousProfile = await this.getLatestPsychologyProfile(contactId, organizationId);
      
      if (!previousProfile) {
        // First analysis for this contact - create baseline
        await this.createBaselinePsychologyProfile(contactId, organizationId, newAnalysis, emailId);
        return null;
      }

      // Analyze differences and detect significant changes
      const evolutionAnalysis = this.analyzeEvolution(previousProfile, newAnalysis);
      
      if (!evolutionAnalysis.significantChange) {
        // Update profile but no significant evolution detected
        await this.updatePsychologyProfile(contactId, organizationId, newAnalysis, emailId);
        return null;
      }

      // Significant evolution detected - create evolution event
      const evolutionEvent: PsychologyEvolutionEvent = {
        id: uuidv4(),
        contactId,
        organizationId,
        previousProfile,
        currentProfile: newAnalysis,
        evolutionType: evolutionAnalysis.evolutionType,
        confidence: evolutionAnalysis.confidence,
        insights: evolutionAnalysis.insights,
        recommendedActions: evolutionAnalysis.recommendedActions,
        triggers: evolutionAnalysis.triggers,
        businessImpact: evolutionAnalysis.businessImpact,
        detectedBy,
        emailTriggerId: emailId,
        timestamp: new Date()
      };

      // Store the evolution event
      await this.storeEvolutionEvent(evolutionEvent);

      // Share insight with other agents
      await interAgentCommunication.shareInsight(
        detectedBy,
        AgentType.RELATIONSHIP_ANALYZER,
        {
          content: `Psychology evolution detected: ${evolutionAnalysis.evolutionType} - ${evolutionAnalysis.insights[0]}`,
          confidence: evolutionAnalysis.confidence,
          metadata: {
            evolutionType: evolutionAnalysis.evolutionType,
            businessImpact: evolutionAnalysis.businessImpact,
            contactId,
            emailId
          },
          organizationId,
          emailId,
          contactId
        }
      );

      console.log(`[Psychology Tracker] Evolution detected for contact ${contactId}: ${evolutionAnalysis.evolutionType}`);
      
      return evolutionEvent;

    } catch (error) {
      console.error('Error tracking psychology evolution:', error);
      return null;
    }
  }

  /**
   * Predict future psychology evolution based on patterns
   */
  async predictEvolution(
    contactId: string,
    organizationId: string,
    timeframe: string = '30 days'
  ): Promise<PredictedEvolution | null> {
    try {
      // Get evolution history for pattern analysis
      const evolutionHistory = await this.getEvolutionHistory(contactId, organizationId, 6); // Last 6 months
      
      if (evolutionHistory.length < 2) {
        return null; // Need more data for prediction
      }

      // Analyze patterns
      const patterns = this.analyzeEvolutionPatterns(evolutionHistory);
      
      // Generate prediction
      const prediction: PredictedEvolution = {
        contactId,
        predictedChanges: this.predictFutureProfile(patterns),
        probability: this.calculatePredictionProbability(patterns),
        timeframe,
        influencingFactors: patterns.influencingFactors,
        recommendedInterventions: this.generateInterventionRecommendations(patterns),
        confidenceLevel: patterns.patternStrength
      };

      return prediction;

    } catch (error) {
      console.error('Error predicting evolution:', error);
      return null;
    }
  }

  /**
   * Get comprehensive psychology insights for a contact
   */
  async getComprehensivePsychologyInsights(
    contactId: string,
    organizationId: string
  ): Promise<{
    currentProfile: PsychologyProfile;
    evolutionHistory: PsychologyEvolutionEvent[];
    futurePredicton: PredictedEvolution | null;
    businessImpact: BusinessImpactAssessment;
    recommendedActions: string[];
  }> {
    const currentProfile = await this.getLatestPsychologyProfile(contactId, organizationId);
    const evolutionHistory = await this.getEvolutionHistory(contactId, organizationId);
    const futurePredicton = await this.predictEvolution(contactId, organizationId);

    // Calculate overall business impact
    const businessImpact = this.calculateOverallBusinessImpact(currentProfile, evolutionHistory);
    
    // Generate comprehensive recommendations
    const recommendedActions = this.generateComprehensiveRecommendations(
      currentProfile,
      evolutionHistory,
      futurePredicton
    );

    return {
      currentProfile: currentProfile || {},
      evolutionHistory,
      futurePredicton,
      businessImpact,
      recommendedActions
    };
  }

  /**
   * Analyze evolution between two psychology profiles
   */
  private analyzeEvolution(
    previousProfile: PsychologyProfile,
    currentProfile: PsychologyProfile
  ): {
    significantChange: boolean;
    evolutionType: PsychologyEvolutionEvent['evolutionType'];
    confidence: number;
    insights: string[];
    recommendedActions: string[];
    triggers: EvolutionTrigger[];
    businessImpact: BusinessImpactAssessment;
  } {
    const changes: string[] = [];
    let maxChangeSignificance = 0;
    let evolutionType: PsychologyEvolutionEvent['evolutionType'] = 'behavioral_change';

    // Analyze personality type changes
    if (previousProfile.personality_type !== currentProfile.personality_type && currentProfile.personality_type) {
      changes.push(`Personality type evolved from ${previousProfile.personality_type} to ${currentProfile.personality_type}`);
      maxChangeSignificance = Math.max(maxChangeSignificance, 0.9);
      evolutionType = 'personality_shift';
    }

    // Analyze buying intent changes
    if (previousProfile.conversion_likelihood !== currentProfile.conversion_likelihood) {
      changes.push(`Conversion likelihood changed from ${previousProfile.conversion_likelihood} to ${currentProfile.conversion_likelihood}`);
      maxChangeSignificance = Math.max(maxChangeSignificance, 0.8);
      evolutionType = 'buying_intent_change';
    }

    // Analyze lead score changes
    const leadScoreChange = (currentProfile.lead_score || 0) - (previousProfile.lead_score || 0);
    if (Math.abs(leadScoreChange) > 10) {
      changes.push(`Lead score ${leadScoreChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(leadScoreChange)} points`);
      maxChangeSignificance = Math.max(maxChangeSignificance, 0.7);
      evolutionType = 'buying_intent_change';
    }

    // Analyze relationship orientation changes
    if (previousProfile.relationship_orientation !== currentProfile.relationship_orientation) {
      changes.push(`Relationship orientation shifted from ${previousProfile.relationship_orientation} to ${currentProfile.relationship_orientation}`);
      maxChangeSignificance = Math.max(maxChangeSignificance, 0.6);
      evolutionType = 'relationship_upgrade';
    }

    // Determine if change is significant
    const significantChange = maxChangeSignificance > 0.5 && changes.length > 0;

    const insights = this.generateEvolutionInsights(changes, evolutionType, maxChangeSignificance);
    const recommendedActions = this.generateEvolutionRecommendations(evolutionType, currentProfile);
    const businessImpact = this.assessBusinessImpact(evolutionType, maxChangeSignificance, currentProfile);

    return {
      significantChange,
      evolutionType,
      confidence: maxChangeSignificance,
      insights,
      recommendedActions,
      triggers: this.identifyEvolutionTriggers(previousProfile, currentProfile),
      businessImpact
    };
  }

  private generateEvolutionInsights(
    changes: string[], 
    evolutionType: PsychologyEvolutionEvent['evolutionType'],
    significance: number
  ): string[] {
    const insights: string[] = [...changes];

    switch (evolutionType) {
      case 'personality_shift':
        insights.push('Significant personality evolution detected - may indicate major life/business changes');
        insights.push('Communication approach should be adapted to new personality type');
        break;
      case 'buying_intent_change':
        insights.push('Buying intent has shifted - sales approach should be adjusted accordingly');
        insights.push('Consider updating lead scoring and nurturing strategy');
        break;
      case 'relationship_upgrade':
        insights.push('Relationship dynamics have evolved - opportunity for deeper engagement');
        insights.push('May be ready for more strategic conversations');
        break;
      case 'behavioral_change':
        insights.push('Communication patterns have changed - monitor for underlying causes');
        insights.push('Adjust engagement frequency and style as needed');
        break;
    }

    if (significance > 0.8) {
      insights.push('High-confidence evolution detected - immediate action recommended');
    }

    return insights;
  }

  private generateEvolutionRecommendations(
    evolutionType: PsychologyEvolutionEvent['evolutionType'],
    currentProfile: PsychologyProfile
  ): string[] {
    const actions: string[] = [];

    switch (evolutionType) {
      case 'personality_shift':
        actions.push('Update communication style to match new personality type');
        actions.push('Review and adjust sales approach');
        actions.push('Inform team of personality change');
        break;
      case 'buying_intent_change':
        actions.push('Reassess opportunity qualification');
        actions.push('Adjust follow-up frequency and content');
        actions.push('Consider pricing/proposal updates');
        break;
      case 'relationship_upgrade':
        actions.push('Explore deeper engagement opportunities');
        actions.push('Consider account expansion discussions');
        actions.push('Invite to strategic meetings or events');
        break;
      case 'behavioral_change':
        actions.push('Monitor communication patterns closely');
        actions.push('Investigate potential external factors');
        actions.push('Adapt engagement approach');
        break;
    }

    // Add profile-specific recommendations
    if (currentProfile.lead_score && currentProfile.lead_score > 80) {
      actions.push('High-value contact - prioritize immediate follow-up');
    }

    if (currentProfile.conversion_likelihood === 'high') {
      actions.push('Strong conversion signals - consider accelerating sales process');
    }

    return actions;
  }

  private identifyEvolutionTriggers(
    previousProfile: PsychologyProfile,
    currentProfile: PsychologyProfile
  ): EvolutionTrigger[] {
    const triggers: EvolutionTrigger[] = [];

    // Analyze specific changes to identify triggers
    if (previousProfile.urgency_sensitivity !== currentProfile.urgency_sensitivity) {
      triggers.push({
        type: 'email_content',
        description: 'Urgency sensitivity changed based on recent communication',
        evidence: ['Response time patterns', 'Language urgency indicators'],
        significance: Math.abs((currentProfile.urgency_sensitivity || 0) - (previousProfile.urgency_sensitivity || 0))
      });
    }

    if (previousProfile.relationship_orientation !== currentProfile.relationship_orientation) {
      triggers.push({
        type: 'engagement_change',
        description: 'Relationship orientation shift detected',
        evidence: ['Communication style changes', 'Engagement pattern evolution'],
        significance: 0.8
      });
    }

    return triggers;
  }

  private assessBusinessImpact(
    evolutionType: PsychologyEvolutionEvent['evolutionType'],
    significance: number,
    currentProfile: PsychologyProfile
  ): BusinessImpactAssessment {
    let opportunityScore = significance * 0.7;
    let riskLevel: BusinessImpactAssessment['riskLevel'] = 'low';
    let revenueImpact = 0;
    let relationshipHealth = 0.7;
    let actionUrgency: BusinessImpactAssessment['actionUrgency'] = 'medium';

    switch (evolutionType) {
      case 'buying_intent_change':
        opportunityScore = significance * 0.9;
        revenueImpact = (currentProfile.lead_score || 50) * 100; // Simplified calculation
        actionUrgency = significance > 0.8 ? 'critical' : 'high';
        break;
      case 'relationship_upgrade':
        opportunityScore = significance * 0.8;
        relationshipHealth = 0.9;
        revenueImpact = (currentProfile.lead_score || 50) * 150;
        break;
      case 'personality_shift':
        riskLevel = significance > 0.8 ? 'high' : 'medium';
        actionUrgency = 'high';
        break;
    }

    if (significance > 0.8) {
      riskLevel = 'high';
      actionUrgency = 'critical';
    }

    return {
      opportunityScore,
      riskLevel,
      revenueImpact,
      relationshipHealth,
      actionUrgency,
      strategicImportance: significance
    };
  }

  // Database interaction methods
  private async getLatestPsychologyProfile(contactId: string, organizationId: string): Promise<PsychologyProfile | null> {
    try {
      const supabase = await this.supabase;
      const { data, error } = await supabase
        .from('contact_analysis_history')
        .select('personality_analysis')
        .eq('contact_id', contactId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return data.personality_analysis as PsychologyProfile;
    } catch (error) {
      console.error('Error getting latest psychology profile:', error);
      return null;
    }
  }

  private async createBaselinePsychologyProfile(
    contactId: string,
    organizationId: string,
    profile: PsychologyProfile,
    emailId: string
  ): Promise<void> {
    try {
      const supabase = await this.supabase;
      await supabase.from('contact_analysis_history').insert({
        id: uuidv4(),
        organization_id: organizationId,
        contact_id: contactId,
        email_id: emailId,
        personality_analysis: profile,
        contributing_agents: ['BEHAVIOR_TRACKER'],
        overall_confidence: 0.7,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating baseline psychology profile:', error);
    }
  }

  private async updatePsychologyProfile(
    contactId: string,
    organizationId: string,
    profile: PsychologyProfile,
    emailId: string
  ): Promise<void> {
    try {
      const supabase = await this.supabase;
      await supabase.from('contact_analysis_history').insert({
        id: uuidv4(),
        organization_id: organizationId,
        contact_id: contactId,
        email_id: emailId,
        personality_analysis: profile,
        contributing_agents: ['BEHAVIOR_TRACKER'],
        overall_confidence: 0.7,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating psychology profile:', error);
    }
  }

  private async storeEvolutionEvent(event: PsychologyEvolutionEvent): Promise<void> {
    try {
      const supabase = await this.supabase;
      await supabase.from('contact_psychology_evolution').insert({
        id: event.id,
        organization_id: event.organizationId,
        contact_id: event.contactId,
        previous_analysis: event.previousProfile,
        current_analysis: event.currentProfile,
        evolution_type: event.evolutionType,
        confidence: event.confidence,
        insights: event.insights,
        recommended_actions: event.recommendedActions,
        detected_by_agent: event.detectedBy,
        email_trigger_id: event.emailTriggerId,
        created_at: event.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Error storing evolution event:', error);
    }
  }

  private async getEvolutionHistory(
    contactId: string,
    organizationId: string,
    months: number = 12
  ): Promise<PsychologyEvolutionEvent[]> {
    try {
      const supabase = await this.supabase;
      const { data, error } = await supabase
        .from('contact_psychology_evolution')
        .select('*')
        .eq('contact_id', contactId)
        .eq('organization_id', organizationId)
        .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map(record => ({
        id: record.id,
        contactId: record.contact_id,
        organizationId: record.organization_id,
        previousProfile: record.previous_analysis,
        currentProfile: record.current_analysis,
        evolutionType: record.evolution_type,
        confidence: record.confidence,
        insights: record.insights || [],
        recommendedActions: record.recommended_actions || [],
        triggers: [], // Would need separate table for detailed triggers
        businessImpact: this.assessBusinessImpact(record.evolution_type, record.confidence, record.current_analysis),
        detectedBy: record.detected_by_agent,
        emailTriggerId: record.email_trigger_id,
        timestamp: new Date(record.created_at)
      }));
    } catch (error) {
      console.error('Error getting evolution history:', error);
      return [];
    }
  }

  // Additional helper methods for pattern analysis and predictions
  private analyzeEvolutionPatterns(history: PsychologyEvolutionEvent[]): any {
    // Simplified pattern analysis - would be more sophisticated in production
    return {
      influencingFactors: ['communication_frequency', 'response_time', 'content_complexity'],
      patternStrength: history.length > 3 ? 0.8 : 0.5,
      dominantEvolutionType: history[0]?.evolutionType || 'behavioral_change'
    };
  }

  private predictFutureProfile(patterns: any): PsychologyProfile {
    // Simplified prediction logic
    return {
      personality_type: 'evolving',
      conversion_likelihood: 'increasing',
      lead_score: 85
    };
  }

  private calculatePredictionProbability(patterns: any): number {
    return patterns.patternStrength * 0.9;
  }

  private generateInterventionRecommendations(patterns: any): string[] {
    return [
      'Maintain consistent communication cadence',
      'Monitor for relationship warming opportunities',
      'Prepare for potential buying intent increase'
    ];
  }

  private calculateOverallBusinessImpact(
    currentProfile: PsychologyProfile | null,
    evolutionHistory: PsychologyEvolutionEvent[]
  ): BusinessImpactAssessment {
    const recentEvolution = evolutionHistory[0];
    
    return recentEvolution?.businessImpact || {
      opportunityScore: currentProfile?.lead_score ? currentProfile.lead_score / 100 : 0.5,
      riskLevel: 'medium',
      revenueImpact: (currentProfile?.lead_score || 50) * 100,
      relationshipHealth: 0.7,
      actionUrgency: 'medium',
      strategicImportance: 0.6
    };
  }

  private generateComprehensiveRecommendations(
    currentProfile: PsychologyProfile | null,
    evolutionHistory: PsychologyEvolutionEvent[],
    futurePredicton: PredictedEvolution | null
  ): string[] {
    const recommendations: string[] = [];

    if (evolutionHistory.length > 0) {
      recommendations.push(...evolutionHistory[0].recommendedActions);
    }

    if (futurePredicton) {
      recommendations.push(...futurePredicton.recommendedInterventions);
    }

    if (currentProfile?.conversion_likelihood === 'high') {
      recommendations.push('High conversion probability - accelerate sales process');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }
}

export const enhancedPsychologyTracker = new EnhancedPsychologyTracker();
