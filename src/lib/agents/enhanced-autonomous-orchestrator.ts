/**
 * ENHANCED AUTONOMOUS ORCHESTRATOR - Phase 1 Implementation
 * 
 * This builds upon our existing agent systems and email processing to provide
 * autonomous orchestration with contact evolution detection.
 */

import { MultiAgentOrchestrator } from './multi-agent-orchestrator';
import { AdvancedEvolutionDetector, EvolutionDetectionResult } from './advanced-evolution-detector';
import { 
  EnhancedSalesAgentV2, 
  EnhancedCustomerAgentV2, 
  RelationshipIntelligenceAgent,
  AdvancedAnalysisResult 
} from './enhanced-agents-v2';
import { SmartDecisionEngine, SmartDecision } from './smart-decision-engine';
import { createClient } from '@/lib/supabase/client';
import { interAgentCommunication, ConsensusResult } from './inter-agent-communication';
import { AgentType } from './autonomous-orchestrator';
import { v4 as uuidv4 } from 'uuid';
import { behavioralPredictionEngine } from '@/lib/psychology/behavioral-prediction-engine';
import { signalExtractor } from '@/lib/psychology/signal-extractor';
import { industryPsychologyModels } from '@/lib/psychology/industry-psychology-models';
import { cognitiveBiasEngine } from '@/lib/psychology/cognitive-bias-engine';
import { crossCustomerLearning } from '@/lib/intelligence/cross-customer-learning';

export interface OrchestrationResult {
  orchestration_id: string;
  success: boolean;
  agents_activated: string[];
  evolution_detected: boolean;
  evolution_events: any[];
  agent_analyses: AdvancedAnalysisResult[];
  smart_decisions: SmartDecision[];
  autonomous_actions_taken: number;
  requires_human_attention: boolean;
  confidence: number;
  processing_time_ms: number;
  phase: 'phase_2';
}

export class EnhancedAutonomousOrchestrator {
  private multiAgentOrchestrator: MultiAgentOrchestrator;
  private evolutionDetector: AdvancedEvolutionDetector;
  private smartDecisionEngine: SmartDecisionEngine;
  
  // Phase 2 Enhanced Agents
  private salesAgentV2: EnhancedSalesAgentV2;
  private customerAgentV2: EnhancedCustomerAgentV2;
  private relationshipAgent: RelationshipIntelligenceAgent;
  
  private supabase;

  constructor() {
    this.multiAgentOrchestrator = new MultiAgentOrchestrator();
    this.evolutionDetector = new AdvancedEvolutionDetector();
    this.smartDecisionEngine = new SmartDecisionEngine();
    
    // Initialize Phase 2 enhanced agents
    this.salesAgentV2 = new EnhancedSalesAgentV2();
    this.customerAgentV2 = new EnhancedCustomerAgentV2();
    this.relationshipAgent = new RelationshipIntelligenceAgent();
    
    this.supabase = createClient();
  }

  /**
   * Initialize all Phase 2 components
   */
  async initialize() {
    await this.salesAgentV2.initialize();
  }

  /**
   * Main orchestration method - Phase 2 Enhanced Version
   */
  async orchestrate(
    email: any,
    userId: string
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const orchestrationId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🚀 Phase 2 Autonomous Orchestration started for email ${email.id}`);

      // Step 1: Get email context and contact information
      const { contact, emailContext } = await this.getEnhancedEmailContext(email, userId);
      
      // Step 2: Advanced Evolution Detection
      const evolutionResult = await this.detectAdvancedEvolution(email, contact, userId);
      
      // Step 3: Determine Enhanced Agent Activation
      const agentsToActivate = await this.determineEnhancedAgents(email, contact, evolutionResult);
      
      // Step 4: Execute Enhanced Multi-Agent Analysis
      const agentAnalyses = await this.executeEnhancedAgentWorkflow(
        email, contact, agentsToActivate, userId
      );
      
      // Step 5: Smart Decision Processing
      const smartDecisions = await this.processSmartDecisions(
        email, contact, agentAnalyses, userId
      );
      
      // Step 6: Execute Autonomous Actions
      const autonomousActionsCount = await this.executeAutonomousActions(
        smartDecisions, email, contact, userId
      );
      
      // Step 7: Log Enhanced Orchestration Results
      await this.logEnhancedOrchestrationResults(
        orchestrationId, email, contact, evolutionResult, agentAnalyses, smartDecisions, userId
      );
      
      // Step 8: Update Performance Metrics
      await this.updatePhase2PerformanceMetrics(
        agentsToActivate, agentAnalyses, smartDecisions
      );

      const processingTime = Date.now() - startTime;
      const requiresHumanAttention = smartDecisions.some(d => d.requires_approval);
      const overallConfidence = this.calculateOverallConfidence(agentAnalyses, smartDecisions);

      console.log(`✅ Phase 2 Orchestration completed in ${processingTime}ms`);
      console.log(`📊 Results: ${agentAnalyses.length} agents, ${smartDecisions.length} decisions, ${autonomousActionsCount} autonomous actions`);

      return {
        orchestration_id: orchestrationId,
        success: true,
        agents_activated: agentsToActivate,
        evolution_detected: evolutionResult.evolutionDetected,
        evolution_events: evolutionResult.evolutionEvents,
        agent_analyses: agentAnalyses,
        smart_decisions: smartDecisions,
        autonomous_actions_taken: autonomousActionsCount,
        requires_human_attention: requiresHumanAttention,
        confidence: overallConfidence,
        processing_time_ms: processingTime,
        phase: 'phase_2'
      };

    } catch (error) {
      console.error('Phase 2 Orchestration failed:', error instanceof Error ? error.message : String(error));
      
      // Log the failure
      await this.logOrchestrationFailure(orchestrationId, email, error, userId);
      
      return {
        orchestration_id: orchestrationId,
        success: false,
        agents_activated: [],
        evolution_detected: false,
        evolution_events: [],
        agent_analyses: [],
        smart_decisions: [],
        autonomous_actions_taken: 0,
        requires_human_attention: true,
        confidence: 0,
        processing_time_ms: Date.now() - startTime,
        phase: 'phase_2'
      };
    }
  }

  /**
   * Get enhanced email context with relationship data
   */
  private async getEnhancedEmailContext(email: any, userId: string) {
    // Get contact information
    const { data: contact, error } = await this.supabase
      .from('contacts')
      .select(`
        *,
        company_data:companies(*)
      `)
      .eq('email', email.from_email)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching contact:', error);
      throw new Error(`Contact lookup failed: ${error.message}`);
    }

    // Enhanced email context with metadata
    const emailContext = {
      ...email,
      received_at: new Date(email.created_at),
      business_hours: this.isBusinessHours(new Date(email.created_at)),
      email_thread_position: await this.getEmailThreadPosition(email, contact?.id),
      previous_interactions_count: await this.getPreviousInteractionCount(contact?.id),
      last_interaction_days: await this.getLastInteractionDays(contact?.id)
    };

    return { contact, emailContext };
  }

  /**
   * Advanced evolution detection using Phase 2 capabilities
   */
  private async detectAdvancedEvolution(
    email: any, 
    contact: any, 
    userId: string
  ): Promise<EvolutionDetectionResult> {
    if (!contact) {
      return {
        evolutionDetected: false,
        evolutionEvents: [],
        behavioralMilestones: [],
        communicationChanges: [],
        confidenceScore: 0
      };
    }

    return await this.evolutionDetector.detectEvolution(contact.id, email, userId);
  }

  /**
   * Determine which enhanced agents to activate
   */
  private async determineEnhancedAgents(
    email: any, 
    contact: any, 
    evolutionResult: EvolutionDetectionResult
  ): Promise<AgentType[]> {
    const agents: AgentType[] = [];

    // Always activate relationship intelligence for all emails
    agents.push(AgentType.RELATIONSHIP_ANALYZER);

    // Email agent for basic analysis
    agents.push(AgentType.EMAIL_PROCESSOR);

    // Conditional agent activation based on enhanced criteria
    const content = (email.content || email.body || '').toLowerCase();

    // Enhanced Sales Agent V2 activation
    if (this.containsAdvancedSalesSignals(content, evolutionResult)) {
      agents.push(AgentType.SALES_SPECIALIST);
    }

    // Enhanced Customer Agent V2 activation
    if (this.containsAdvancedCustomerSignals(content, evolutionResult, contact)) {
      agents.push(AgentType.CUSTOMER_SUCCESS);
    }

    // Product agent activation (legacy)
    if (this.containsProductSignals(content)) {
      agents.push(AgentType.PRODUCT_MATCHER);
    }

    console.log(`🎯 Enhanced agents activated: ${agents.join(', ')}`);
    return agents;
  }

  /**
   * ENHANCED: Execute Enhanced Multi-Agent Analysis with Inter-Agent Communication
   */
  private async executeEnhancedAgentWorkflow(
    email: any, 
    contact: any, 
    agentsToActivate: AgentType[], 
    userId: string
  ): Promise<any[]> {
    console.log(`[Enhanced Orchestrator] Executing workflow with ${agentsToActivate.length} agents using inter-agent communication`);
    
    const agentAnalyses: any[] = [];
    const organizationId = email.organization_id || contact?.organization_id;

    // Step 1: Execute initial agent analyses
    for (const agentType of agentsToActivate) {
      try {
        const analysis = await this.executeAgentAnalysis(agentType, email, contact, userId);
        
        // Share key insights with other agents
        if (analysis.keyInsights) {
          for (const insight of analysis.keyInsights) {
            // Share with all other agents in the workflow
            const otherAgents = agentsToActivate.filter(a => a !== agentType);
            for (const targetAgent of otherAgents) {
              await interAgentCommunication.shareInsight(agentType, targetAgent, {
                agentType,
                content: insight,
                confidence: analysis.confidence || 0.7,
                metadata: { 
                  source: 'workflow_analysis',
                  emailId: email.id,
                  contactId: contact?.id
                },
                organizationId,
                emailId: email.id,
                contactId: contact?.id
              });
            }
          }
        }

        agentAnalyses.push({
          agentType,
          analysis,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`[Enhanced Orchestrator] Error in ${agentType} analysis:`, error instanceof Error ? error.message : String(error));
        agentAnalyses.push({
          agentType,
          analysis: { error: error instanceof Error ? error.message : String(error), confidence: 0 },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 2: Cross-agent collaboration for complex decisions
    if (agentsToActivate.length >= 2) {
        const collaborativeDecisions = await this.executeCollaborativeDecisions(
        agentsToActivate, 
        email, 
        contact, 
        organizationId
      );

      // Add collaborative decisions to the analysis results
      agentAnalyses.push({
        agentType: 'COLLABORATIVE',
        analysis: {
          collaborativeDecisions,
          confidence: this.calculateOverallConfidenceFromConsensus(collaborativeDecisions)
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[Enhanced Orchestrator] Completed enhanced workflow with ${agentAnalyses.length} agent analyses including collaborative decisions`);
    
    return agentAnalyses;
  }

  // Provide a stub for executeAgentAnalysis to satisfy types until the concrete agent analyses are wired.
  private async executeAgentAnalysis(
    agentType: AgentType,
    email: any,
    contact: any,
    userId: string
  ): Promise<{ keyInsights?: string[]; confidence?: number; recommendations?: any } & Record<string, any>> {
    // Minimal placeholder analysis
    return { keyInsights: [], confidence: 0.7 };
  }

  /**
   * NEW: Execute collaborative decisions between agents
   */
  private async executeCollaborativeDecisions(
    agents: AgentType[],
    email: any,
    contact: any,
    organizationId: string
  ): Promise<ConsensusResult[]> {
    const decisions: ConsensusResult[] = [];

    // Decision 1: Response urgency and priority
    if (agents.includes(AgentType.EMAIL_PROCESSOR) && 
        (agents.includes(AgentType.SALES_SPECIALIST) || agents.includes(AgentType.CUSTOMER_SUCCESS))) {
      
      const urgencyDecision = await interAgentCommunication.collaborativeDecision(
        [AgentType.EMAIL_PROCESSOR, AgentType.SALES_SPECIALIST, AgentType.CUSTOMER_SUCCESS].filter(a => agents.includes(a)),
        {
          question: 'What is the appropriate response urgency and priority for this email?',
          context: {
            email,
            contact,
            emailContent: email.raw_content || email.body,
            senderInfo: email.from_email,
            subject: email.subject
          },
          organizationId,
          emailId: email.id,
          contactId: contact?.id
        }
      );

      decisions.push(urgencyDecision);
    }

    // Decision 2: Customer relationship status and next best action
    if (agents.includes(AgentType.RELATIONSHIP_ANALYZER) && agents.includes(AgentType.BEHAVIOR_TRACKER)) {
      
      const relationshipDecision = await interAgentCommunication.collaborativeDecision(
        [AgentType.RELATIONSHIP_ANALYZER, AgentType.BEHAVIOR_TRACKER, AgentType.CUSTOMER_SUCCESS].filter(a => agents.includes(a)),
        {
          question: 'What is the current relationship status and what should be our next best action?',
          context: {
            contact,
            email,
            previousInteractions: contact?.interaction_history || [],
            currentEngagement: contact?.engagement_metrics || {}
          },
          organizationId,
          emailId: email.id,
          contactId: contact?.id
        }
      );

      decisions.push(relationshipDecision);
    }

    // Decision 3: Sales opportunity assessment
    if (agents.includes(AgentType.SALES_SPECIALIST) && agents.includes(AgentType.OPPORTUNITY_HUNTER)) {
      
      const salesDecision = await interAgentCommunication.collaborativeDecision(
        [AgentType.SALES_SPECIALIST, AgentType.OPPORTUNITY_HUNTER, AgentType.PRODUCT_MATCHER].filter(a => agents.includes(a)),
        {
          question: 'Is there a sales opportunity and what specific actions should we take?',
          context: {
            email,
            contact,
            buyingSignals: this.extractBuyingSignals(email.raw_content || email.body),
            customerHistory: contact?.purchase_history || []
          },
          organizationId,
          emailId: email.id,
          contactId: contact?.id
        }
      );

      decisions.push(salesDecision);
    }

    console.log(`[Enhanced Orchestrator] Completed ${decisions.length} collaborative decisions`);
    return decisions;
  }

  /**
   * ENHANCED: Process Smart Decisions with Agent Collaboration
   */
  private async processSmartDecisions(
    email: any,
    contact: any,
    agentAnalyses: any[],
    userId: string
  ): Promise<any[]> {
    const smartDecisions: any[] = [];

    // Find collaborative decisions from agent analyses
    const collaborativeAnalysis = agentAnalyses.find(a => a.agentType === 'COLLABORATIVE');
    const collaborativeDecisions = collaborativeAnalysis?.analysis?.collaborativeDecisions || [];

    // Process each collaborative decision
    for (const decision of collaborativeDecisions) {
      let smartDecision: any = {
        id: uuidv4(),
        type: this.mapDecisionToActionType(decision),
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        requires_approval: decision.confidence < 0.8 || decision.warningFlags.length > 0,
        collaborative_input: {
          participatingAgents: decision.dissenting.length === 0 ? 'unanimous' : 'majority',
          supportLevel: decision.supportLevel,
          dissenting: decision.dissenting,
          warningFlags: decision.warningFlags
        },
        timestamp: new Date().toISOString()
      };

      // Add specific actions based on decision type
      if (decision.decision === 'requires_immediate_response') {
        smartDecision.actions = ['generate_urgent_response', 'escalate_to_human'];
        smartDecision.priority = 'high';
      } else if (decision.decision === 'qualified_lead') {
        smartDecision.actions = ['create_opportunity', 'schedule_follow_up', 'update_lead_score'];
        smartDecision.priority = 'high';
      } else if (decision.decision === 'relationship_warming') {
        smartDecision.actions = ['personalized_response', 'relationship_nurturing', 'engagement_tracking'];
        smartDecision.priority = 'medium';
      } else if (decision.decision === 'upsell_identified') {
        smartDecision.actions = ['prepare_upsell_proposal', 'schedule_discovery_call', 'product_recommendation'];
        smartDecision.priority = 'high';
      }

      smartDecisions.push(smartDecision);
    }

    // Add individual agent insights as additional smart decisions
    for (const agentAnalysis of agentAnalyses.filter(a => a.agentType !== 'COLLABORATIVE')) {
      if (agentAnalysis.analysis.recommendations) {
        smartDecisions.push({
          id: uuidv4(),
          type: 'agent_recommendation',
          source_agent: agentAnalysis.agentType,
          recommendations: agentAnalysis.analysis.recommendations,
          confidence: agentAnalysis.analysis.confidence || 0.7,
          requires_approval: agentAnalysis.analysis.confidence < 0.7,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Phase 2 enrichment here
    const organizationId = email.organization_id || contact?.organization_id;
    return await this.enrichWithPhase2Intelligence(email, contact, organizationId, smartDecisions);
  }

  /**
   * Execute autonomous actions based on smart decisions
   */
  private async executeAutonomousActions(
    smartDecisions: SmartDecision[],
    email: any,
    contact: any,
    userId: string
  ): Promise<number> {
    let autonomousActionsCount = 0;

    for (const decision of smartDecisions) {
      if (decision.executed_automatically && !decision.requires_approval) {
        try {
          const success = await this.executeAction(decision, email, contact, userId);
          
          if (success) {
            autonomousActionsCount++;
            
            // Log the autonomous action
            await this.logAutonomousAction(decision, email, contact, userId);
          }
        } catch (error) {
          console.error(`Autonomous action execution failed:`, error);
        }
      }
    }

    console.log(`⚡ Autonomous actions executed: ${autonomousActionsCount}`);
    return autonomousActionsCount;
  }

  /**
   * Log enhanced orchestration results
   */
  private async logEnhancedOrchestrationResults(
    orchestrationId: string,
    email: any,
    contact: any,
    evolutionResult: EvolutionDetectionResult,
    agentAnalyses: AdvancedAnalysisResult[],
    smartDecisions: SmartDecision[],
    userId: string
  ) {
    try {
      // Save to agent_orchestration_workflows table
      const { error: workflowError } = await this.supabase
        .from('agent_orchestration_workflows')
        .insert({
          workflow_id: orchestrationId,
          email_id: email.id,
          contact_id: contact?.id,
          agents_activated: agentAnalyses.map(a => a.agent_type),
          workflow_status: 'completed',
          total_processing_time: Date.now() - parseInt(orchestrationId.split('_')[1]),
          phase: 'phase_2',
          user_id: userId
        });

      if (workflowError) {
        console.error('Error logging workflow:', workflowError);
      }

      // Save individual agent decisions with enhanced data
      for (const decision of smartDecisions) {
        const { error: decisionError } = await this.supabase
          .from('agent_decisions')
          .insert({
            workflow_id: orchestrationId,
            email_id: email.id,
            contact_id: contact?.id,
            agent_type: decision.decision_type.includes('sales') ? 'sales_v2' : 
                       decision.decision_type.includes('customer') ? 'customer_v2' :
                       decision.decision_type.includes('relationship') ? 'relationship' : 'general',
            decision_type: decision.decision_type,
            confidence: decision.context_adjusted_confidence,
            executed_automatically: decision.executed_automatically,
            requires_human_approval: decision.requires_approval,
            reasoning: decision.reasoning,
            execution_time_ms: 0, // Will be updated when executed
            context_factors: decision.context_factors,
            risk_assessment: decision.risk_assessment,
            business_impact_prediction: decision.business_impact_prediction,
            dynamic_threshold_used: decision.dynamic_threshold,
            user_id: userId
          });

        if (decisionError) {
          console.error('Error logging decision:', decisionError);
        }
      }

    } catch (error) {
      console.error('Error logging enhanced orchestration results:', error);
    }
  }

  /**
   * Update Phase 2 performance metrics
   */
  private async updatePhase2PerformanceMetrics(
    agents: string[],
    analyses: AdvancedAnalysisResult[],
    decisions: SmartDecision[]
  ) {
    for (const analysis of analyses) {
      try {
        // Calculate industry-specific accuracy if available
        const industryAccuracy = analysis.industry_context ? {
          [analysis.industry_context.industry]: analysis.confidence
        } : {};

        // Calculate evolution detection accuracy for relevant agents
        const evolutionAccuracy = ['sales_v2', 'customer_v2', 'relationship'].includes(analysis.agent_type) ?
          analysis.confidence : undefined;

        const { error } = await this.supabase
          .from('agent_performance_metrics')
          .upsert({
            agent_type: analysis.agent_type,
            total_executions: 1,
            successful_executions: analysis.confidence > 0.5 ? 1 : 0,
            average_confidence: analysis.confidence,
            success_rate: analysis.confidence > 0.5 ? 1.0 : 0.0,
            industry_specific_accuracy: industryAccuracy,
            context_awareness_score: decisions.find(d => d.decision_type.includes(analysis.agent_type))?.context_adjusted_confidence,
            evolution_detection_accuracy: evolutionAccuracy,
            predictive_accuracy: analysis.predictive_insights ? 0.8 : undefined, // Placeholder
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'agent_type'
          });

        if (error) {
          console.error(`Error updating performance metrics for ${analysis.agent_type}:`, error);
        }
      } catch (error) {
        console.error(`Error in performance metrics update:`, error);
      }
    }
  }

  // Helper methods for enhanced signal detection

  private containsAdvancedSalesSignals(
    content: string, 
    evolutionResult: EvolutionDetectionResult
  ): boolean {
    // Enhanced sales signal detection
    const salesSignals = [
      'price', 'cost', 'budget', 'proposal', 'quote', 'purchase', 'buy',
      'decision', 'timeline', 'contract', 'agreement', 'vendor', 'roi'
    ];

    const hasDirectSignals = salesSignals.some(signal => content.includes(signal));
    
    // Evolution-based signals
    const hasEvolutionSignals = evolutionResult.behavioralMilestones.some(milestone =>
      ['buying_signal_escalation', 'decision_maker_language'].includes(milestone.type)
    );

    return hasDirectSignals || hasEvolutionSignals;
  }

  private containsAdvancedCustomerSignals(
    content: string, 
    evolutionResult: EvolutionDetectionResult,
    contact: any
  ): boolean {
    // Enhanced customer success signal detection
    const customerSignals = [
      'problem', 'issue', 'support', 'help', 'question', 'concern',
      'feedback', 'improvement', 'feature', 'bug', 'error'
    ];

    const hasDirectSignals = customerSignals.some(signal => content.includes(signal));
    
    // Check if this is an existing customer
    const isExistingCustomer = contact?.status === 'customer' || contact?.is_customer;
    
    // Evolution-based churn risk signals
    const hasChurnSignals = evolutionResult.evolutionEvents.some(event =>
      event.type === 'sentiment_evolution' && event.insight.includes('declined')
    );

    return hasDirectSignals || isExistingCustomer || hasChurnSignals;
  }

  private containsProductSignals(content: string): boolean {
    const productSignals = [
      'feature', 'functionality', 'integration', 'api', 'technical',
      'specification', 'requirement', 'capability', 'demo', 'trial'
    ];

    return productSignals.some(signal => content.includes(signal));
  }

  // Helper methods

  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  }

  private async getEmailThreadPosition(email: any, contactId: string): Promise<number> {
    if (!contactId) return 1;
    
    const { data } = await this.supabase
      .from('email_queue')
      .select('id')
      .eq('contact_id', contactId)
      .lte('created_at', email.created_at)
      .order('created_at', { ascending: true });
    
    return data?.length || 1;
  }

  private async getPreviousInteractionCount(contactId: string): Promise<number> {
    if (!contactId) return 0;
    
    const { data } = await this.supabase
      .from('email_queue')
      .select('id', { count: 'exact' })
      .eq('contact_id', contactId);
    
    return data?.length || 0;
  }

  private async getLastInteractionDays(contactId: string): Promise<number> {
    if (!contactId) return 999;
    
    const { data } = await this.supabase
      .from('email_queue')
      .select('created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(2);
    
    if (!data || data.length < 2) return 999;
    
    const lastInteraction = new Date(data[1].created_at);
    const daysDiff = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.round(daysDiff);
  }

  private calculateBusinessOpportunityScore(analysis: any): number {
    // Simple calculation for legacy agents
    return analysis.confidence * 75; // Convert to 0-100 scale
  }

  private calculateOverallConfidence(
    analyses: AdvancedAnalysisResult[], 
    decisions: SmartDecision[]
  ): number {
    const analysisConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / Math.max(analyses.length, 1);
    const decisionConfidence = decisions.reduce((sum, d) => sum + d.context_adjusted_confidence, 0) / Math.max(decisions.length, 1);
    
    return (analysisConfidence + decisionConfidence) / 2;
  }

  private async generateBaseDecisions(
    analyses: AdvancedAnalysisResult[],
    email: any,
    contact: any
  ) {
    const decisions = [];

    for (const analysis of analyses) {
      if (analysis.confidence > 0.4) {
        // Generate decisions based on agent type and analysis
        switch (analysis.agent_type) {
                     case 'sales_v2':
             if (analysis.business_opportunity_score && analysis.business_opportunity_score > 60) {
               decisions.push({
                 decision_type: 'sales_followup',
                 confidence: analysis.confidence,
                 agent_type: analysis.agent_type
               });
             }
            break;
            
          case 'customer_v2':
            if (analysis.risk_assessment?.churn_probability > 0.6) {
              decisions.push({
                decision_type: 'customer_intervention',
                confidence: analysis.confidence,
                agent_type: analysis.agent_type
              });
            }
            break;
            
          case 'relationship':
            decisions.push({
              decision_type: 'relationship_optimization',
              confidence: analysis.confidence,
              agent_type: analysis.agent_type
            });
            break;
            
          case 'email':
            if (analysis.confidence > 0.7) {
              decisions.push({
                decision_type: 'auto_response',
                confidence: analysis.confidence,
                agent_type: analysis.agent_type
              });
            }
            break;
        }
      }
    }

    return decisions;
  }

  private async executeAction(
    decision: SmartDecision,
    email: any,
    contact: any,
    userId: string
  ): Promise<boolean> {
    // Execute the autonomous action based on decision type
    console.log(`⚡ Executing autonomous action: ${decision.decision_type}`);
    
    switch (decision.decision_type) {
      case 'profile_update':
        // Update contact profile with new insights
        return await this.updateContactProfile(contact, decision, userId);
        
      case 'relationship_optimization':
        // Log relationship insights
        return await this.logRelationshipInsights(contact, decision, userId);
        
      default:
        console.log(`Action type ${decision.decision_type} not yet implemented for autonomous execution`);
        return false;
    }
  }

  private async updateContactProfile(contact: any, decision: SmartDecision, userId: string): Promise<boolean> {
    // Update contact profile based on evolution insights
    try {
      const updates: any = {};
      
      if (decision.context_factors.relational.relationshipStage) {
        updates.relationship_stage = decision.context_factors.relational.relationshipStage;
      }
      
      if (Object.keys(updates).length > 0) {
        const { error } = await this.supabase
          .from('contacts')
          .update(updates)
          .eq('id', contact.id)
          .eq('user_id', userId);
        
        return !error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating contact profile:', error);
      return false;
    }
  }

  private async logRelationshipInsights(contact: any, decision: SmartDecision, userId: string): Promise<boolean> {
    // Log relationship insights for future reference
    return true; // Simplified implementation
  }

  private async logAutonomousAction(
    decision: SmartDecision,
    email: any,
    contact: any,
    userId: string
  ) {
    const { error } = await this.supabase
      .from('autonomous_actions_log')
      .insert({
        email_id: email.id,
        contact_id: contact?.id,
        decision_type: decision.decision_type,
        action_taken: 'executed_automatically',
        confidence_score: decision.context_adjusted_confidence,
        reasoning: decision.reasoning,
        business_impact: decision.business_impact_prediction,
        user_id: userId
      });

    if (error) {
      console.error('Error logging autonomous action:', error);
    }
  }

  private async logOrchestrationFailure(
    orchestrationId: string,
    email: any,
    error: unknown,
    userId: string
  ) {
    const { error: logError } = await this.supabase
      .from('agent_orchestration_workflows')
      .insert({
        workflow_id: orchestrationId,
        email_id: email.id,
        workflow_status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        phase: 'phase_2',
        user_id: userId
      });

    if (logError) {
      console.error('Error logging orchestration failure:', logError);
    }
  }
  /**
   * NEW: Calculate overall confidence from collaborative decisions
   */
  private calculateOverallConfidenceFromConsensus(decisions: ConsensusResult[]): number {
    if (decisions.length === 0) return 0.5;
    const totalConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0);
    const averageConfidence = totalConfidence / decisions.length;
    const warningPenalty = decisions.reduce((sum, d) => sum + (d.warningFlags?.length || 0) * 0.1, 0);
    return Math.max(0.1, Math.min(1.0, averageConfidence - warningPenalty));
  }

  /**
   * NEW: Extract buying signals from email content
   */
  private extractBuyingSignals(content: string): string[] {
    const buyingSignals: string[] = [];
    const signals = [
      'budget', 'timeline', 'decision maker', 'approval', 'purchase', 'buy',
      'contract', 'pricing', 'cost', 'proposal', 'quote', 'roi',
      'implementation', 'rollout', 'team size', 'requirements'
    ];

    const lowerContent = content.toLowerCase();
    for (const signal of signals) {
      if (lowerContent.includes(signal)) {
        buyingSignals.push(signal);
      }
    }

    return buyingSignals;
  }

  /**
   * NEW: Map collaborative decision to action type
   */
  private mapDecisionToActionType(decision: ConsensusResult): string {
    const decisionStr = String(decision.decision).toLowerCase();
    if (decisionStr.includes('urgent') || decisionStr.includes('immediate')) {
      return 'urgent_response';
    } else if (decisionStr.includes('qualified') || decisionStr.includes('lead')) {
      return 'sales_opportunity';
    } else if (decisionStr.includes('relationship') || decisionStr.includes('warming')) {
      return 'relationship_management';
    } else if (decisionStr.includes('upsell') || decisionStr.includes('opportunity')) {
      return 'revenue_opportunity';
    }
    return 'general_action';
  }

  // After agentAnalyses are produced, enrich with Phase 2 intelligence
  private async enrichWithPhase2Intelligence(
    email: any,
    contact: any,
    organizationId: string,
    smartDecisions: any[]
  ): Promise<any[]> {
    try {
      // 1) Extract recent signals
      const signals = await signalExtractor.extractEmailSignals(contact.id, organizationId, 25);

      // 2) Behavioral evolution + next action prediction
      const evolution = await behavioralPredictionEngine.analyzeCommunicationEvolution(
        contact.id,
        organizationId,
        signals
      );

      const prediction = await behavioralPredictionEngine.predictNextAction(evolution, {
        lastInteractionAt: email.created_at,
        relationshipStage: contact.relationship_stage || 'evaluating',
        opportunityScore: contact.opportunity_score || 50
      });

      smartDecisions.push({
        id: `pred_${Date.now()}`,
        type: 'behavioral_prediction',
        evolution,
        prediction,
        actions: [prediction.nextBestAction],
        priority: prediction.expectedImpact === 'high' ? 'high' : 'medium',
        confidence: prediction.probability,
        requires_approval: prediction.probability < 0.75,
        timestamp: new Date().toISOString()
      });

      // 3) Cognitive bias optimization suggestion (summary only)
      const biasProfile = cognitiveBiasEngine.deriveBiasProfile({
        personalityType: contact.personalitytype,
        tonePreference: contact.tone_preference,
        culturalTone: contact.cultural_tone,
        decisionStyle: contact.decision_style,
      });

      const biasMsg = cognitiveBiasEngine.generateMessage(
        { subject: email.subject || 'Re: your message', body: 'Draft will be adapted accordingly.' },
        biasProfile,
        'advance_deal'
      );

      smartDecisions.push({
        id: `bias_${Date.now()}`,
        type: 'cognitive_bias_suggestion',
        biasApplied: biasMsg.biasApplied,
        timingHours: biasMsg.timingHours,
        confidence: biasMsg.confidence,
        rationale: biasMsg.rationale,
        priority: 'medium',
        timestamp: new Date().toISOString()
      });

      // Persist a lean snapshot into emails.metadata.phase2
      await this.persistPhase2Insights(email.id, organizationId, {
        evolution,
        prediction,
        bias: {
          biasApplied: biasMsg.biasApplied,
          timingHours: biasMsg.timingHours,
          rationale: biasMsg.rationale
        }
      });

      return smartDecisions;
    } catch (error) {
      console.error('[Enhanced Orchestrator][Phase2] Enrichment error:', error);
      return smartDecisions;
    }
  }

  private async persistPhase2Insights(
    emailId: string,
    organizationId: string,
    phase2: { evolution: any; prediction: any; bias: any }
  ) {
    try {
      const supabase = await this.supabase;

      // Fetch current metadata
      const { data: current } = await supabase
        .from('emails')
        .select('id, metadata')
        .eq('id', emailId)
        .eq('organization_id', organizationId)
        .single();

      const newMetadata = {
        ...(current?.metadata || {}),
        phase2
      };

      await supabase
        .from('emails')
        .update({ metadata: newMetadata })
        .eq('id', emailId)
        .eq('organization_id', organizationId);
    } catch (err) {
      console.error('[Enhanced Orchestrator][Phase2] Persist insights failed:', err);
    }
  }
} 