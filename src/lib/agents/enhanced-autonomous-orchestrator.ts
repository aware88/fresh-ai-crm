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
      console.error('Phase 2 Orchestration failed:', error);
      
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
  ): Promise<string[]> {
    const agents = [];

    // Always activate relationship intelligence for all emails
    agents.push('relationship');

    // Email agent for basic analysis
    agents.push('email');

    // Conditional agent activation based on enhanced criteria
    const content = (email.content || email.body || '').toLowerCase();

    // Enhanced Sales Agent V2 activation
    if (this.containsAdvancedSalesSignals(content, evolutionResult)) {
      agents.push('sales_v2');
    }

    // Enhanced Customer Agent V2 activation
    if (this.containsAdvancedCustomerSignals(content, evolutionResult, contact)) {
      agents.push('customer_v2');
    }

    // Product agent activation (legacy)
    if (this.containsProductSignals(content)) {
      agents.push('product');
    }

    console.log(`🎯 Enhanced agents activated: ${agents.join(', ')}`);
    return agents;
  }

  /**
   * Execute enhanced multi-agent workflow
   */
  private async executeEnhancedAgentWorkflow(
    email: any,
    contact: any,
    agents: string[],
    userId: string
  ): Promise<AdvancedAnalysisResult[]> {
    const results: AdvancedAnalysisResult[] = [];

    // Execute agents in parallel for better performance
    const agentPromises = agents.map(async (agentType) => {
      try {
        switch (agentType) {
          case 'sales_v2':
            return await this.salesAgentV2.analyzeEmail(email, contact, userId);
            
          case 'customer_v2':
            return await this.customerAgentV2.analyzeEmail(email, contact, userId);
            
          case 'relationship':
            return await this.relationshipAgent.analyzeEmail(email, contact, userId);
            
          case 'email':
          case 'product':
            // Use existing multi-agent orchestrator for legacy agents
            const workflowId = await this.multiAgentOrchestrator.executeWorkflow(
              'email-analysis-workflow',
              {
                email,
                contact,
                agentType
              },
              'autonomous-orchestrator'
            );
            
            // For now, return a simplified analysis result for legacy agents
            // In a full implementation, we would wait for the workflow to complete and get results
            return {
              agent_type: agentType,
              confidence: 0.7, // Default confidence for legacy agents
              analysis_result: {
                processed: true,
                workflow_id: workflowId,
                legacy_agent: true
              },
              business_opportunity_score: this.calculateBusinessOpportunityScore({ confidence: 0.7 })
            };
        }
        return null;
      } catch (error) {
        console.error(`Enhanced agent ${agentType} failed:`, error);
        return null;
      }
    });

    const agentResults = await Promise.all(agentPromises);
    
    // Filter out null results and add to final results
    agentResults.forEach(result => {
      if (result) {
        results.push(result);
      }
    });

    console.log(`📊 Enhanced agent analyses completed: ${results.length} successful`);
    return results;
  }

  /**
   * Process decisions using Smart Decision Engine
   */
  private async processSmartDecisions(
    email: any,
    contact: any,
    agentAnalyses: AdvancedAnalysisResult[],
    userId: string
  ): Promise<SmartDecision[]> {
    const smartDecisions: SmartDecision[] = [];

    // Generate base decisions from agent analyses
    const baseDecisions = await this.generateBaseDecisions(agentAnalyses, email, contact);

    // Process each decision through Smart Decision Engine
    for (const baseDecision of baseDecisions) {
      try {
        const smartDecision = await this.smartDecisionEngine.processDecision(
          baseDecision,
          email,
          contact,
          agentAnalyses.find(a => a.agent_type === baseDecision.agent_type) || agentAnalyses[0],
          userId
        );
        
        smartDecisions.push(smartDecision);
      } catch (error) {
        console.error(`Smart decision processing failed for ${baseDecision.decision_type}:`, error);
      }
    }

    console.log(`🧠 Smart decisions processed: ${smartDecisions.length} decisions`);
    return smartDecisions;
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
    error: any,
    userId: string
  ) {
    const { error: logError } = await this.supabase
      .from('agent_orchestration_workflows')
      .insert({
        workflow_id: orchestrationId,
        email_id: email.id,
        workflow_status: 'failed',
        error_message: error.message,
        phase: 'phase_2',
        user_id: userId
      });

    if (logError) {
      console.error('Error logging orchestration failure:', logError);
    }
  }
} 