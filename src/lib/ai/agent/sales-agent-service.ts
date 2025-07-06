/**
 * Sales Agent Service
 * 
 * This service manages sales agent interactions, decision making, and memory integration.
 */

import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import { Database } from '@/types/supabase';
import { 
  AgentPersonality, 
  ConversationContext, 
  ConversationState,
  AgentDecision,
  AgentDecisionType,
  AgentActionResult,
  AgentConfig,
  MemoryAccessLevel,
  AgentMemoryPreferences,
  AgentMessage,
  ContactMessage
} from './types';
import { 
  AIMemoryService, 
  AIMemory, 
  AIMemoryType, 
  AIMemoryAccessType,
  AIMemorySearchParams
} from '../memory/ai-memory-service';
import { MemoryEnabledSalesTacticsService } from '../sales-tactics-with-memory';

/**
 * Sales Agent Service
 */
export class SalesAgentService {
  private supabase;
  private openai;
  private memoryService: AIMemoryService;
  private tacticsService: MemoryEnabledSalesTacticsService;
  
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
    
    // Initialize OpenAI client
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
    
    // Initialize services
    this.memoryService = new AIMemoryService();
    this.tacticsService = new MemoryEnabledSalesTacticsService();
  }
  
  /**
   * Get agent personality
   * 
   * @param personalityId - ID of the agent personality
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Agent personality
   */
  async getAgentPersonality(
    personalityId: string,
    organizationId: string
  ): Promise<AgentPersonality | null> {
    const { data, error } = await this.supabase
      .from('agent_personalities')
      .select('*')
      .eq('id', personalityId)
      .eq('organization_id', organizationId)
      .single();
    
    if (error || !data) {
      console.error('Error getting agent personality:', error);
      return null;
    }
    
    return data as AgentPersonality;
  }
  
  /**
   * Get agent configuration
   * 
   * @param agentId - ID of the agent
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Agent configuration
   */
  async getAgentConfig(
    agentId: string,
    organizationId: string
  ): Promise<AgentConfig | null> {
    const { data, error } = await this.supabase
      .from('agent_configs')
      .select('*')
      .eq('id', agentId)
      .eq('organization_id', organizationId)
      .single();
    
    if (error || !data) {
      console.error('Error getting agent config:', error);
      return null;
    }
    
    return data as AgentConfig;
  }
  
  /**
   * Get agent memory preferences
   * 
   * @param agentId - ID of the agent
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Agent memory preferences
   */
  async getAgentMemoryPreferences(
    agentId: string,
    organizationId: string
  ): Promise<AgentMemoryPreferences | null> {
    const { data, error } = await this.supabase
      .from('agent_memory_preferences')
      .select('*')
      .eq('agent_id', agentId)
      .eq('organization_id', organizationId)
      .single();
    
    if (error || !data) {
      console.error('Error getting agent memory preferences:', error);
      return null;
    }
    
    return data as AgentMemoryPreferences;
  }
  
  /**
   * Get or create conversation context
   * 
   * @param conversationId - ID of the conversation
   * @param agentId - ID of the agent
   * @param contactId - ID of the contact (optional)
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Conversation context
   */
  async getOrCreateConversationContext(
    conversationId: string,
    agentId: string,
    contactId: string | undefined,
    organizationId: string
  ): Promise<ConversationContext> {
    // Try to get existing context
    const { data, error } = await this.supabase
      .from('conversation_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('organization_id', organizationId)
      .single();
    
    if (data) {
      return data as ConversationContext;
    }
    
    // Create new context if not found
    const newContext: Partial<ConversationContext> = {
      organization_id: organizationId,
      agent_id: agentId,
      contact_id: contactId,
      conversation_id: conversationId,
      conversation_state: ConversationState.GREETING,
      metadata: {},
    };
    
    const { data: createdContext, error: createError } = await this.supabase
      .from('conversation_contexts')
      .insert(newContext)
      .select()
      .single();
    
    if (createError || !createdContext) {
      console.error('Error creating conversation context:', createError);
      throw new Error('Failed to create conversation context');
    }
    
    return createdContext as ConversationContext;
  }
  
  /**
   * Update conversation context
   * 
   * @param context - Updated conversation context
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Updated conversation context
   */
  async updateConversationContext(
    context: Partial<ConversationContext>,
    organizationId: string
  ): Promise<ConversationContext> {
    if (!context.id) {
      throw new Error('Context ID is required for update');
    }
    
    const { data, error } = await this.supabase
      .from('conversation_contexts')
      .update({
        ...context,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.id)
      .eq('organization_id', organizationId)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating conversation context:', error);
      throw new Error('Failed to update conversation context');
    }
    
    return data as ConversationContext;
  }
  
  /**
   * Process contact message
   * 
   * @param message - Contact message to process
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Agent response and action result
   */
  async processContactMessage(
    message: ContactMessage,
    organizationId: string
  ): Promise<{ response: AgentMessage; result: AgentActionResult }> {
    try {
      // Get conversation context
      const context = await this.getOrCreateConversationContext(
        message.conversation_id,
        message.metadata.agent_id,
        message.contact_id,
        organizationId
      );
      
      // Get agent configuration
      const agentConfig = await this.getAgentConfig(context.agent_id, organizationId);
      if (!agentConfig) {
        throw new Error('Agent configuration not found');
      }
      
      // Get agent personality
      const personality = await this.getAgentPersonality(agentConfig.personality_id, organizationId);
      if (!personality) {
        throw new Error('Agent personality not found');
      }
      
      // Get agent memory preferences
      const memoryPreferences = await this.getAgentMemoryPreferences(context.agent_id, organizationId);
      
      // Store contact message in memory if appropriate
      let contactMemoryId: string | undefined;
      if (memoryPreferences && agentConfig.memory_access_level !== MemoryAccessLevel.NONE) {
        const contactMemory = await this.memoryService.storeMemory({
          organization_id: organizationId,
          content: `Contact message: ${message.content}`,
          metadata: {
            conversation_id: message.conversation_id,
            contact_id: message.contact_id,
            message_id: message.id
          },
          memory_type: AIMemoryType.INTERACTION,
          importance_score: 0.6 // Default importance for contact messages
        });
        
        contactMemoryId = contactMemory.id;
        
        // Update contact message with memory ID
        await this.supabase
          .from('contact_messages')
          .update({ memory_ids: [contactMemoryId] })
          .eq('id', message.id)
          .eq('organization_id', organizationId);
      }
      
      // Retrieve relevant memories if agent has memory access
      let relevantMemories: AIMemory[] = [];
      if (memoryPreferences && agentConfig.memory_access_level !== MemoryAccessLevel.NONE) {
        // Search for relevant memories
        const searchParams: AIMemorySearchParams = {
          query: message.content,
          memory_types: memoryPreferences.memory_types_to_access,
          min_importance: memoryPreferences.min_importance_to_access,
          max_results: memoryPreferences.max_memories_per_context,
          metadata_filters: message.contact_id ? { contact_id: message.contact_id } : undefined
        };
        
        const searchResults = await this.memoryService.searchMemories(searchParams, organizationId);
        relevantMemories = searchResults.map(result => result.memory);
        
        // Record memory access for each retrieved memory
        for (const memory of relevantMemories) {
          await this.memoryService.recordMemoryAccess({
            organization_id: organizationId,
            memory_id: memory.id,
            access_type: AIMemoryAccessType.RETRIEVE,
            context: `Retrieved for conversation ${message.conversation_id}`
          });
        }
        
        // Update conversation context with relevant memory IDs
        context.relevant_memories = relevantMemories.map(memory => memory.id);
      }
      
      // Get relevant sales tactics if appropriate
      let salesTactics = [];
      if (message.contact_id) {
        try {
          // Get contact personality profile (simplified example)
          const { data: contactProfile } = await this.supabase
            .from('contact_personality_profiles')
            .select('*')
            .eq('contact_id', message.contact_id)
            .eq('organization_id', organizationId)
            .single();
          
          if (contactProfile) {
            // Get memory-enhanced sales tactics
            const enhancedTactics = await this.tacticsService.getMemoryEnhancedSalesTactics(
              contactProfile,
              { content: message.content },
              organizationId
            );
            
            salesTactics = enhancedTactics;
          }
        } catch (error) {
          console.error('Error getting sales tactics:', error);
          // Continue without tactics if there's an error
        }
      }
      
      // Make agent decision
      const decision = await this.makeAgentDecision(
        message,
        context,
        personality,
        relevantMemories,
        salesTactics,
        organizationId
      );
      
      // Store decision in memory if appropriate
      let decisionMemoryId: string | undefined;
      if (memoryPreferences && 
          agentConfig.memory_access_level !== MemoryAccessLevel.NONE && 
          memoryPreferences.memory_types_to_create.includes(AIMemoryType.DECISION)) {
        const decisionMemory = await this.memoryService.storeMemory({
          organization_id: organizationId,
          content: `Agent decision: ${decision.decision_type} - ${decision.reasoning}`,
          metadata: {
            conversation_id: message.conversation_id,
            contact_id: message.contact_id,
            decision_id: decision.id,
            decision_type: decision.decision_type,
            confidence_score: decision.confidence_score
          },
          memory_type: AIMemoryType.DECISION,
          importance_score: decision.confidence_score // Use confidence as initial importance
        });
        
        decisionMemoryId = decisionMemory.id;
        
        // Update decision with memory ID
        await this.supabase
          .from('agent_decisions')
          .update({ memory_id: decisionMemoryId })
          .eq('id', decision.id)
          .eq('organization_id', organizationId);
      }
      
      // Generate agent response based on decision
      const response = await this.generateAgentResponse(
        decision,
        context,
        personality,
        message,
        organizationId
      );
      
      // Store response in memory if appropriate
      let responseMemoryId: string | undefined;
      if (memoryPreferences && 
          agentConfig.memory_access_level !== MemoryAccessLevel.NONE && 
          memoryPreferences.memory_types_to_create.includes(AIMemoryType.INTERACTION)) {
        const responseMemory = await this.memoryService.storeMemory({
          organization_id: organizationId,
          content: `Agent response: ${response.content}`,
          metadata: {
            conversation_id: message.conversation_id,
            contact_id: message.contact_id,
            message_id: response.id,
            decision_id: decision.id
          },
          memory_type: AIMemoryType.INTERACTION,
          importance_score: 0.6 // Default importance for agent responses
        });
        
        responseMemoryId = responseMemory.id;
        
        // Update response with memory ID
        await this.supabase
          .from('agent_messages')
          .update({ memory_ids: [responseMemoryId] })
          .eq('id', response.id)
          .eq('organization_id', organizationId);
        
        // If there's a decision memory, connect it to the response memory
        if (decisionMemoryId) {
          await this.memoryService.connectMemories({
            organization_id: organizationId,
            source_memory_id: decisionMemoryId,
            target_memory_id: responseMemoryId,
            relationship_type: 'CAUSED',
            strength: 0.9
          });
        }
        
        // If there's a contact message memory, connect it to the response memory
        if (contactMemoryId) {
          await this.memoryService.connectMemories({
            organization_id: organizationId,
            source_memory_id: contactMemoryId,
            target_memory_id: responseMemoryId,
            relationship_type: 'CAUSED',
            strength: 0.8
          });
        }
      }
      
      // Update conversation context based on decision
      await this.updateConversationStateFromDecision(context, decision, organizationId);
      
      // Return response and result
      return {
        response,
        result: {
          success: true,
          message: 'Message processed successfully',
          data: {
            decision_type: decision.decision_type,
            conversation_state: context.conversation_state
          },
          memory_id: responseMemoryId
        }
      };
    } catch (error: any) {
      console.error('Error processing contact message:', error);
      
      // Return error result
      return {
        response: {
          id: '',
          organization_id: organizationId,
          agent_id: message.metadata.agent_id,
          conversation_id: message.conversation_id,
          contact_id: message.contact_id,
          content: "I'm sorry, I'm having trouble processing your message. Please try again later.",
          metadata: {},
          created_at: new Date().toISOString()
        },
        result: {
          success: false,
          error: error.message || 'Unknown error',
          message: 'Failed to process message'
        }
      };
    }
  }
  
  /**
   * Make agent decision based on contact message and context
   * 
   * @param message - Contact message
   * @param context - Conversation context
   * @param personality - Agent personality
   * @param relevantMemories - Relevant memories
   * @param salesTactics - Relevant sales tactics
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Agent decision
   */
  private async makeAgentDecision(
    message: ContactMessage,
    context: ConversationContext,
    personality: AgentPersonality,
    relevantMemories: AIMemory[],
    salesTactics: any[],
    organizationId: string
  ): Promise<AgentDecision> {
    try {
      // Prepare prompt for decision making
      const prompt = this.buildDecisionPrompt(
        message,
        context,
        personality,
        relevantMemories,
        salesTactics
      );
      
      // Call OpenAI for decision
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: message.content }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      // Parse decision from response
      const decisionText = response.data.choices[0]?.message?.content || '';
      const decision = this.parseDecisionFromText(decisionText);
      
      // Store decision in database
      const decisionData: Partial<AgentDecision> = {
        organization_id: organizationId,
        agent_id: context.agent_id,
        conversation_id: context.conversation_id,
        decision_type: decision.type,
        reasoning: decision.reasoning,
        confidence_score: decision.confidence,
        selected_action: decision.action,
        alternative_actions: decision.alternatives
      };
      
      const { data: storedDecision, error } = await this.supabase
        .from('agent_decisions')
        .insert(decisionData)
        .select()
        .single();
      
      if (error || !storedDecision) {
        console.error('Error storing agent decision:', error);
        throw new Error('Failed to store agent decision');
      }
      
      return storedDecision as AgentDecision;
    } catch (error) {
      console.error('Error making agent decision:', error);
      
      // Return fallback decision
      const fallbackDecision: Partial<AgentDecision> = {
        organization_id: organizationId,
        agent_id: context.agent_id,
        conversation_id: context.conversation_id,
        decision_type: AgentDecisionType.NEXT_MESSAGE,
        reasoning: 'Fallback due to decision-making error',
        confidence_score: 0.3,
        selected_action: 'Respond with a general message'
      };
      
      const { data: storedDecision } = await this.supabase
        .from('agent_decisions')
        .insert(fallbackDecision)
        .select()
        .single();
      
      return storedDecision as AgentDecision;
    }
  }
  
  /**
   * Build prompt for decision making
   */
  private buildDecisionPrompt(
    message: ContactMessage,
    context: ConversationContext,
    personality: AgentPersonality,
    relevantMemories: AIMemory[],
    salesTactics: any[]
  ): string {
    let prompt = `You are an AI sales agent with the following personality:
Name: ${personality.name}
Description: ${personality.description}
Tone: ${personality.tone.join(', ')}
Communication Style: ${personality.communication_style}
Empathy Level: ${personality.empathy_level * 10}/10
Assertiveness Level: ${personality.assertiveness_level * 10}/10
Formality Level: ${personality.formality_level * 10}/10
Humor Level: ${personality.humor_level * 10}/10
Expertise Areas: ${personality.expertise_areas.join(', ')}

Current conversation state: ${context.conversation_state}
${context.current_goal ? `Current goal: ${context.current_goal}` : ''}

Your task is to decide on the next action to take in this conversation.
Analyze the contact's message and determine the most appropriate response type.

`;

    // Add relevant memories if available
    if (relevantMemories.length > 0) {
      prompt += `\nRelevant memories from past interactions:\n`;
      relevantMemories.forEach((memory, index) => {
        prompt += `${index + 1}. ${memory.content}\n`;
      });
    }
    
    // Add sales tactics if available
    if (salesTactics.length > 0) {
      prompt += `\nRelevant sales tactics you can use:\n`;
      salesTactics.forEach((tactic, index) => {
        const effectiveness = tactic.effectiveness_score 
          ? `(Effectiveness: ${Math.round(tactic.effectiveness_score * 10)}/10)` 
          : '';
        prompt += `${index + 1}. ${tactic.category}: "${tactic.tactical_snippet}" ${effectiveness}\n`;
      });
    }
    
    prompt += `
Please output your decision in the following format:
DECISION_TYPE: [one of NEXT_MESSAGE, CHANGE_TOPIC, ASK_QUESTION, PRESENT_OFFER, ADDRESS_OBJECTION, CLOSE_DEAL, SCHEDULE_FOLLOW_UP, END_CONVERSATION]
CONFIDENCE: [number between 0 and 1]
REASONING: [your reasoning for this decision]
ACTION: [specific action to take]
ALTERNATIVES: [comma-separated list of alternative actions you considered]
`;

    return prompt;
  }
  
  /**
   * Parse decision from OpenAI response text
   */
  private parseDecisionFromText(text: string): {
    type: AgentDecisionType;
    confidence: number;
    reasoning: string;
    action: string;
    alternatives: string[];
  } {
    // Default values
    const result = {
      type: AgentDecisionType.NEXT_MESSAGE,
      confidence: 0.5,
      reasoning: 'No specific reasoning provided',
      action: 'Respond to the message',
      alternatives: []
    };
    
    // Extract decision type
    const typeMatch = text.match(/DECISION_TYPE:\s*(\w+)/i);
    if (typeMatch && typeMatch[1]) {
      const type = typeMatch[1].toUpperCase() as AgentDecisionType;
      if (Object.values(AgentDecisionType).includes(type)) {
        result.type = type;
      }
    }
    
    // Extract confidence
    const confidenceMatch = text.match(/CONFIDENCE:\s*(0\.\d+|1\.0|1)/i);
    if (confidenceMatch && confidenceMatch[1]) {
      result.confidence = parseFloat(confidenceMatch[1]);
    }
    
    // Extract reasoning
    const reasoningMatch = text.match(/REASONING:\s*(.+?)(?=ACTION:|ALTERNATIVES:|$)/is);
    if (reasoningMatch && reasoningMatch[1]) {
      result.reasoning = reasoningMatch[1].trim();
    }
    
    // Extract action
    const actionMatch = text.match(/ACTION:\s*(.+?)(?=ALTERNATIVES:|$)/is);
    if (actionMatch && actionMatch[1]) {
      result.action = actionMatch[1].trim();
    }
    
    // Extract alternatives
    const alternativesMatch = text.match(/ALTERNATIVES:\s*(.+?)$/is);
    if (alternativesMatch && alternativesMatch[1]) {
      result.alternatives = alternativesMatch[1]
        .split(',')
        .map(alt => alt.trim())
        .filter(alt => alt.length > 0);
    }
    
    return result;
  }
  
  /**
   * Generate agent response based on decision
   */
  private async generateAgentResponse(
    decision: AgentDecision,
    context: ConversationContext,
    personality: AgentPersonality,
    message: ContactMessage,
    organizationId: string
  ): Promise<AgentMessage> {
    try {
      // Prepare prompt for response generation
      const prompt = this.buildResponsePrompt(decision, context, personality);
      
      // Call OpenAI for response
      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: message.content }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });
      
      const responseContent = response.data.choices[0]?.message?.content || 
        "I'm sorry, I'm having trouble generating a response. Please try again later.";
      
      // Store response in database
      const responseData: Partial<AgentMessage> = {
        organization_id: organizationId,
        agent_id: context.agent_id,
        conversation_id: context.conversation_id,
        contact_id: message.contact_id,
        content: responseContent,
        decision_id: decision.id,
        metadata: {
          decision_type: decision.decision_type,
          conversation_state: context.conversation_state
        }
      };
      
      const { data: storedResponse, error } = await this.supabase
        .from('agent_messages')
        .insert(responseData)
        .select()
        .single();
      
      if (error || !storedResponse) {
        console.error('Error storing agent response:', error);
        throw new Error('Failed to store agent response');
      }
      
      return storedResponse as AgentMessage;
    } catch (error) {
      console.error('Error generating agent response:', error);
      
      // Return fallback response
      const fallbackResponse: Partial<AgentMessage> = {
        organization_id: organizationId,
        agent_id: context.agent_id,
        conversation_id: context.conversation_id,
        contact_id: message.contact_id,
        content: "I'm sorry, I'm having trouble generating a response. Please try again later.",
        decision_id: decision.id,
        metadata: {}
      };
      
      const { data: storedResponse } = await this.supabase
        .from('agent_messages')
        .insert(fallbackResponse)
        .select()
        .single();
      
      return storedResponse as AgentMessage;
    }
  }
  
  /**
   * Build prompt for response generation
   */
  private buildResponsePrompt(
    decision: AgentDecision,
    context: ConversationContext,
    personality: AgentPersonality
  ): string {
    let prompt = `You are an AI sales agent with the following personality:
Name: ${personality.name}
Description: ${personality.description}
Tone: ${personality.tone.join(', ')}
Communication Style: ${personality.communication_style}
Empathy Level: ${personality.empathy_level * 10}/10
Assertiveness Level: ${personality.assertiveness_level * 10}/10
Formality Level: ${personality.formality_level * 10}/10
Humor Level: ${personality.humor_level * 10}/10
Expertise Areas: ${personality.expertise_areas.join(', ')}

Current conversation state: ${context.conversation_state}
${context.current_goal ? `Current goal: ${context.current_goal}` : ''}

You have decided to take the following action:
Decision Type: ${decision.decision_type}
Action: ${decision.selected_action}
Reasoning: ${decision.reasoning}

Generate a response that aligns with this decision and your personality.
Make sure your response is natural, conversational, and doesn't explicitly mention your decision process.
`;

    // Add specific instructions based on decision type
    switch (decision.decision_type) {
      case AgentDecisionType.ASK_QUESTION:
        prompt += '\nInclude a clear question to gather more information from the contact.';
        break;
      case AgentDecisionType.PRESENT_OFFER:
        prompt += '\nPresent your offer clearly and highlight its value proposition.';
        break;
      case AgentDecisionType.ADDRESS_OBJECTION:
        prompt += '\nAddress the contact\'s concerns empathetically while providing reassurance.';
        break;
      case AgentDecisionType.CLOSE_DEAL:
        prompt += '\nInclude a clear call to action to move the deal forward.';
        break;
      case AgentDecisionType.SCHEDULE_FOLLOW_UP:
        prompt += '\nSuggest a specific time for follow-up and explain the next steps.';
        break;
    }

    return prompt;
  }
  
  /**
   * Update conversation state based on agent decision
   */
  private async updateConversationStateFromDecision(
    context: ConversationContext,
    decision: AgentDecision,
    organizationId: string
  ): Promise<ConversationContext> {
    // Determine new conversation state based on decision type
    let newState = context.conversation_state;
    
    switch (decision.decision_type) {
      case AgentDecisionType.CHANGE_TOPIC:
        // State depends on the specific topic change
        if (decision.selected_action.toLowerCase().includes('discovery')) {
          newState = ConversationState.DISCOVERY;
        } else if (decision.selected_action.toLowerCase().includes('present')) {
          newState = ConversationState.PRESENTING;
        } else if (decision.selected_action.toLowerCase().includes('objection')) {
          newState = ConversationState.OBJECTION_HANDLING;
        } else if (decision.selected_action.toLowerCase().includes('clos')) {
          newState = ConversationState.CLOSING;
        }
        break;
      case AgentDecisionType.ASK_QUESTION:
        newState = ConversationState.DISCOVERY;
        break;
      case AgentDecisionType.PRESENT_OFFER:
        newState = ConversationState.PRESENTING;
        break;
      case AgentDecisionType.ADDRESS_OBJECTION:
        newState = ConversationState.OBJECTION_HANDLING;
        break;
      case AgentDecisionType.CLOSE_DEAL:
        newState = ConversationState.CLOSING;
        break;
      case AgentDecisionType.SCHEDULE_FOLLOW_UP:
        newState = ConversationState.FOLLOW_UP;
        break;
      case AgentDecisionType.END_CONVERSATION:
        newState = ConversationState.ENDED;
        break;
    }
    
    // Update context with new state
    const updatedContext = await this.updateConversationContext(
      {
        id: context.id,
        conversation_state: newState
      },
      organizationId
    );
    
    return updatedContext;
  }
}
