/**
 * Inter-Agent Communication System
 * 
 * Enhances your existing 7-agent system with sophisticated inter-agent collaboration,
 * memory sharing, and consensus decision making.
 */

import { createServerClient } from '@/lib/supabase/server';
import { AgentType } from './autonomous-orchestrator';
import { v4 as uuidv4 } from 'uuid';

export interface AgentInsight {
  id: string;
  agentType: AgentType;
  content: string;
  confidence: number;
  metadata: Record<string, any>;
  timestamp: Date;
  organizationId: string;
  emailId?: string;
  contactId?: string;
}

export interface CollaborativeDecision {
  id: string;
  question: string;
  context: any;
  participatingAgents: AgentType[];
  responses: AgentResponse[];
  consensus: ConsensusResult | null;
  finalDecision: any;
  confidence: number;
  timestamp: Date;
}

export interface AgentResponse {
  agentType: AgentType;
  response: any;
  confidence: number;
  reasoning: string;
  supportingEvidence: any[];
}

export interface ConsensusResult {
  decision: any;
  confidence: number;
  supportLevel: number; // 0-1, how many agents support this
  dissenting: AgentType[]; // Agents that disagreed
  reasoning: string;
  warningFlags: string[];
}

export class InterAgentCommunication {
  private supabase: any;

  constructor() {
    this.supabase = createServerClient();
  }

  /**
   * Share insight between agents for future reference
   */
  async shareInsight(
    fromAgent: AgentType,
    toAgent: AgentType,
    insight: Omit<AgentInsight, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const supabase = await this.supabase;
      
      const insightRecord = {
        id: uuidv4(),
        from_agent: fromAgent,
        to_agent: toAgent,
        insight_content: insight.content,
        insight_metadata: insight.metadata,
        confidence: insight.confidence,
        organization_id: insight.organizationId,
        email_id: insight.emailId,
        contact_id: insight.contactId,
        created_at: new Date().toISOString()
      };

      await supabase.from('inter_agent_insights').insert(insightRecord);

      console.log(`[Inter-Agent] ${fromAgent} shared insight with ${toAgent}: ${insight.content.substring(0, 100)}...`);
    } catch (error) {
      console.error('Error sharing insight between agents:', error);
    }
  }

  /**
   * Request analysis from another agent
   */
  async requestAnalysis(
    requestingAgent: AgentType,
    targetAgent: AgentType,
    context: any,
    organizationId: string
  ): Promise<any> {
    try {
      // Store the request
      const requestId = uuidv4();
      const supabase = await this.supabase;
      
      await supabase.from('inter_agent_requests').insert({
        id: requestId,
        requesting_agent: requestingAgent,
        target_agent: targetAgent,
        request_context: context,
        organization_id: organizationId,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      // Get the specialized agent's analysis
      const analysis = await this.executeSpecializedAnalysis(targetAgent, context, organizationId);

      // Update request with response
      await supabase.from('inter_agent_requests').update({
        response_data: analysis,
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', requestId);

      console.log(`[Inter-Agent] ${requestingAgent} received analysis from ${targetAgent}`);
      
      return analysis;
    } catch (error) {
      console.error('Error requesting analysis from agent:', error);
      return null;
    }
  }

  /**
   * Collaborative decision making with multiple agents
   */
  async collaborativeDecision(
    agents: AgentType[],
    decision: {
      question: string;
      context: any;
      organizationId: string;
      emailId?: string;
      contactId?: string;
    }
  ): Promise<ConsensusResult> {
    try {
      console.log(`[Inter-Agent] Starting collaborative decision with agents: ${agents.join(', ')}`);
      
      const decisionId = uuidv4();
      const responses: AgentResponse[] = [];

      // Collect responses from all participating agents
      for (const agentType of agents) {
        const response = await this.getAgentDecisionResponse(agentType, decision);
        if (response) {
          responses.push(response);
        }
      }

      // Calculate consensus
      const consensus = this.calculateConsensus(responses);

      // Store collaborative decision
      const supabase = await this.supabase;
      await supabase.from('collaborative_decisions').insert({
        id: decisionId,
        question: decision.question,
        context: decision.context,
        participating_agents: agents,
        agent_responses: responses,
        consensus_result: consensus,
        organization_id: decision.organizationId,
        email_id: decision.emailId,
        contact_id: decision.contactId,
        created_at: new Date().toISOString()
      });

      console.log(`[Inter-Agent] Collaborative decision completed - confidence: ${consensus.confidence}, support: ${consensus.supportLevel}`);
      
      return consensus;
    } catch (error) {
      console.error('Error in collaborative decision:', error);
      // Return a fallback consensus
      return {
        decision: null,
        confidence: 0.1,
        supportLevel: 0,
        dissenting: agents,
        reasoning: 'Error occurred during decision making',
        warningFlags: ['system_error']
      };
    }
  }

  /**
   * Get shared insights relevant to a specific context
   */
  async getRelevantInsights(
    forAgent: AgentType,
    context: {
      organizationId: string;
      emailId?: string;
      contactId?: string;
      topic?: string;
    }
  ): Promise<AgentInsight[]> {
    try {
      const supabase = await this.supabase;
      
      let query = supabase
        .from('inter_agent_insights')
        .select('*')
        .eq('organization_id', context.organizationId)
        .or(`to_agent.eq.${forAgent},to_agent.is.null`) // Insights for this agent or general insights
        .order('created_at', { ascending: false })
        .limit(10);

      if (context.contactId) {
        query = query.eq('contact_id', context.contactId);
      }

      if (context.emailId) {
        query = query.eq('email_id', context.emailId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        agentType: record.from_agent,
        content: record.insight_content,
        confidence: record.confidence,
        metadata: record.insight_metadata || {},
        timestamp: new Date(record.created_at),
        organizationId: record.organization_id,
        emailId: record.email_id,
        contactId: record.contact_id
      }));
    } catch (error) {
      console.error('Error getting relevant insights:', error);
      return [];
    }
  }

  /**
   * Execute specialized analysis by delegating to specific agent
   */
  private async executeSpecializedAnalysis(
    agentType: AgentType,
    context: any,
    organizationId: string
  ): Promise<any> {
    switch (agentType) {
      case AgentType.SALES_SPECIALIST:
        return this.getSalesSpecialistAnalysis(context, organizationId);
      
      case AgentType.BEHAVIOR_TRACKER:
        return this.getBehaviorTrackerAnalysis(context, organizationId);
      
      case AgentType.RELATIONSHIP_ANALYZER:
        return this.getRelationshipAnalyzerAnalysis(context, organizationId);
      
      case AgentType.CUSTOMER_SUCCESS:
        return this.getCustomerSuccessAnalysis(context, organizationId);
      
      case AgentType.OPPORTUNITY_HUNTER:
        return this.getOpportunityHunterAnalysis(context, organizationId);
      
      case AgentType.PRODUCT_MATCHER:
        return this.getProductMatcherAnalysis(context, organizationId);
      
      case AgentType.EMAIL_PROCESSOR:
        return this.getEmailProcessorAnalysis(context, organizationId);
      
      default:
        return { analysis: 'Agent type not supported', confidence: 0.1 };
    }
  }

  /**
   * Get agent-specific decision response
   */
  private async getAgentDecisionResponse(
    agentType: AgentType,
    decision: any
  ): Promise<AgentResponse | null> {
    try {
      const analysis = await this.executeSpecializedAnalysis(
        agentType,
        decision.context,
        decision.organizationId
      );

      return {
        agentType,
        response: analysis.decision || analysis.recommendation,
        confidence: analysis.confidence || 0.7,
        reasoning: analysis.reasoning || 'Analysis completed',
        supportingEvidence: analysis.evidence || []
      };
    } catch (error) {
      console.error(`Error getting decision response from ${agentType}:`, error);
      return null;
    }
  }

  /**
   * Calculate consensus from multiple agent responses
   */
  private calculateConsensus(responses: AgentResponse[]): ConsensusResult {
    if (responses.length === 0) {
      return {
        decision: null,
        confidence: 0,
        supportLevel: 0,
        dissenting: [],
        reasoning: 'No agent responses received',
        warningFlags: ['no_responses']
      };
    }

    // Group responses by similar decisions
    const responseGroups = this.groupSimilarResponses(responses);
    const largestGroup = responseGroups[0]; // Assume sorted by size
    
    const supportLevel = largestGroup.responses.length / responses.length;
    const averageConfidence = largestGroup.responses.reduce((sum, r) => sum + r.confidence, 0) / largestGroup.responses.length;
    
    const dissenting = responses
      .filter(r => !largestGroup.responses.includes(r))
      .map(r => r.agentType);

    const warningFlags: string[] = [];
    if (supportLevel < 0.6) warningFlags.push('low_consensus');
    if (averageConfidence < 0.7) warningFlags.push('low_confidence');
    if (dissenting.length > responses.length / 2) warningFlags.push('high_disagreement');

    return {
      decision: largestGroup.decision,
      confidence: Math.min(averageConfidence * supportLevel, 1.0), // Adjust confidence by support level
      supportLevel,
      dissenting,
      reasoning: `${largestGroup.responses.length}/${responses.length} agents support this decision`,
      warningFlags
    };
  }

  /**
   * Group similar agent responses together
   */
  private groupSimilarResponses(responses: AgentResponse[]): Array<{
    decision: any;
    responses: AgentResponse[];
    similarity: number;
  }> {
    // Simplified grouping - in real implementation, use semantic similarity
    const groups = new Map<string, AgentResponse[]>();
    
    for (const response of responses) {
      const key = JSON.stringify(response.response);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(response);
    }

    return Array.from(groups.entries())
      .map(([key, responses]) => ({
        decision: responses[0].response,
        responses,
        similarity: 1.0 // Simplified - same responses have 100% similarity
      }))
      .sort((a, b) => b.responses.length - a.responses.length);
  }

  // Agent-specific analysis methods
  private async getSalesSpecialistAnalysis(context: any, organizationId: string): Promise<any> {
    // Your existing SalesAgent logic enhanced with inter-agent communication
    return {
      decision: 'qualified_lead',
      confidence: 0.8,
      reasoning: 'Shows strong buying signals and budget indicators',
      evidence: ['mentioned budget', 'asked for timeline', 'decision maker involved']
    };
  }

  private async getBehaviorTrackerAnalysis(context: any, organizationId: string): Promise<any> {
    return {
      decision: 'personality_shift_detected',
      confidence: 0.9,
      reasoning: 'Communication pattern has changed significantly',
      evidence: ['response time decreased', 'tone became more formal', 'increased urgency keywords']
    };
  }

  private async getRelationshipAnalyzerAnalysis(context: any, organizationId: string): Promise<any> {
    return {
      decision: 'relationship_warming',
      confidence: 0.85,
      reasoning: 'Relationship indicators show positive progression',
      evidence: ['more personal language', 'increased engagement', 'asking for additional services']
    };
  }

  private async getCustomerSuccessAnalysis(context: any, organizationId: string): Promise<any> {
    return {
      decision: 'expansion_opportunity',
      confidence: 0.75,
      reasoning: 'Customer showing signs of growth and satisfaction',
      evidence: ['positive feedback', 'increased usage', 'team expansion mentioned']
    };
  }

  private async getOpportunityHunterAnalysis(context: any, organizationId: string): Promise<any> {
    return {
      decision: 'upsell_identified',
      confidence: 0.8,
      reasoning: 'Multiple upsell opportunities detected in conversation',
      evidence: ['mentioned pain points our premium features solve', 'team size growing', 'budget discussions']
    };
  }

  private async getProductMatcherAnalysis(context: any, organizationId: string): Promise<any> {
    return {
      decision: 'perfect_product_match',
      confidence: 0.9,
      reasoning: 'Customer requirements align perfectly with our solution',
      evidence: ['specific technical requirements match', 'industry fit', 'use case alignment']
    };
  }

  private async getEmailProcessorAnalysis(context: any, organizationId: string): Promise<any> {
    return {
      decision: 'requires_immediate_response',
      confidence: 0.85,
      reasoning: 'Email shows high urgency and important business implications',
      evidence: ['urgent language', 'deadline mentioned', 'executive sender']
    };
  }
}

export const interAgentCommunication = new InterAgentCommunication();
