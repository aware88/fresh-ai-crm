/**
 * Memory Enhanced Sales Agent
 * 
 * Extends the TransparentSalesAgent with enhanced memory capabilities using
 * the MemoryContextProvider for more effective customer interactions.
 */

import { TransparentSalesAgent } from './transparent-sales-agent';
import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryContextProvider, ContextRequest, MemoryContext } from '../memory/memory-context-provider';
import { MemoryService } from '../memory/memory-service';
import { AIMemory, AIMemoryType } from '../memory/ai-memory-service';
import { v4 as uuidv4 } from 'uuid';

// Types for memory-enhanced interactions
export interface MemoryEnhancedConfig {
  enableMemoryCreation: boolean;
  enableMemoryRetrieval: boolean;
  maxMemoriesToRetrieve: number;
  minRelevanceScore: number;
  memoryTypes: AIMemoryType[];
}

export class MemoryEnhancedSalesAgent extends TransparentSalesAgent {
  private memoryContextProvider: MemoryContextProvider;
  private memoryService: MemoryService;
  private memoryConfig: MemoryEnhancedConfig;
  
  constructor(
    supabaseClient: SupabaseClient,
    openaiClient: any,
    agentId: string,
    organizationId: string
  ) {
    super(supabaseClient, openaiClient, agentId, organizationId);
    
    // Initialize memory services
    this.memoryService = new MemoryService(supabaseClient);
    this.memoryContextProvider = new MemoryContextProvider(
      supabaseClient,
      this.memoryService
    );
    
    // Default memory configuration
    this.memoryConfig = {
      enableMemoryCreation: true,
      enableMemoryRetrieval: true,
      maxMemoriesToRetrieve: 10,
      minRelevanceScore: 0.7,
      memoryTypes: [
        AIMemoryType.PREFERENCE,
        AIMemoryType.FEEDBACK,
        AIMemoryType.INTERACTION,
        AIMemoryType.OBSERVATION,
        AIMemoryType.INSIGHT
      ]
    };
    
    // Load memory configuration asynchronously
    this.loadMemoryConfig();
  }
  
  /**
   * Load memory configuration from database
   */
  private async loadMemoryConfig() {
    try {
      const { data, error } = await this.supabase
        .from('agent_memory_config')
        .select('*')
        .eq('agent_id', this.agentId)
        .eq('organization_id', this.organizationId)
        .single();
      
      if (error || !data) {
        console.warn('No memory configuration found, using defaults');
        return;
      }
      
      // Update memory configuration
      this.memoryConfig = {
        enableMemoryCreation: data.enable_memory_creation ?? true,
        enableMemoryRetrieval: data.enable_memory_retrieval ?? true,
        maxMemoriesToRetrieve: data.max_memories_to_retrieve ?? 10,
        minRelevanceScore: data.min_relevance_score ?? 0.7,
        memoryTypes: data.memory_types ?? this.memoryConfig.memoryTypes
      };
      
    } catch (error) {
      console.error('Error loading memory configuration:', error);
    }
  }
  
  /**
   * Override processContactMessage to include memory context
   */
  async processContactMessage(message: any) {
    // Log the activity start (inherited from TransparentSalesAgent)
    const activity = this.activityLoggingEnabled ? 
      await this.transparencyService.logActivity({
        agentId: this.agentId,
        activityType: 'process_message',
        description: `Processing message from contact ${message.contact_id}`,
        relatedEntityType: 'contact',
        relatedEntityId: message.contact_id,
        metadata: { messageId: message.id }
      }) : null;
    
    try {
      // Retrieve relevant memory context
      const memoryContext = this.memoryConfig.enableMemoryRetrieval ? 
        await this.getRelevantMemoryContext(message) : null;
      
      // Log memory retrieval thought process
      if (this.thoughtLoggingEnabled && activity && memoryContext) {
        await this.transparencyService.logThought({
          agentId: this.agentId,
          activityId: activity.id,
          thoughtStep: 2,
          reasoning: `Retrieved ${memoryContext.memories.length} relevant memories with context ID ${memoryContext.contextId}`,
          confidence: 0.9
        });
      }
      
      // Make a decision about how to respond using memory context
      const decision = await this.makeDecisionWithMemory(message, memoryContext);
      
      // Log the thought process for decision making
      if (this.thoughtLoggingEnabled && activity) {
        await this.transparencyService.logThought({
          agentId: this.agentId,
          activityId: activity.id,
          thoughtStep: 3,
          reasoning: `Decided on approach: ${decision.approach}`,
          alternatives: decision.alternatives,
          confidence: decision.confidence
        });
      }
      
      // Generate the response using the parent class
      const response = await super.processContactMessage(message);
      
      // Create memories from the interaction if enabled
      if (this.memoryConfig.enableMemoryCreation) {
        await this.createMemoriesFromInteraction(message, response, memoryContext);
      }
      
      // Provide feedback on memory context usefulness
      if (memoryContext) {
        await this.memoryContextProvider.updateContextWithFeedback(
          memoryContext.contextId,
          {
            relevanceScore: 0.8, // Default score, could be dynamic based on response
            usefulnessScore: 0.8,
            feedback: `Used in response to contact ${message.contact_id}`
          },
          this.organizationId
        );
      }
      
      return response;
    } catch (error) {
      // Log error (inherited from TransparentSalesAgent)
      if (this.activityLoggingEnabled && activity) {
        await this.transparencyService.logActivity({
          agentId: this.agentId,
          activityType: 'error',
          description: `Error processing message: ${error.message}`,
          relatedEntityType: 'contact',
          relatedEntityId: message.contact_id,
          metadata: { error: error.message, stack: error.stack }
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Get relevant memory context for the current conversation
   */
  private async getRelevantMemoryContext(message: any): Promise<MemoryContext | null> {
    try {
      // Create context request
      const contextRequest: ContextRequest = {
        query: message.content,
        organizationId: this.organizationId,
        userId: message.user_id,
        agentId: this.agentId,
        conversationId: message.conversation_id,
        includeTypes: this.memoryConfig.memoryTypes,
        metadataFilters: {
          contact_id: message.contact_id
        }
      };
      
      // Get memory context
      const context = await this.memoryContextProvider.getContext(contextRequest);
      return context;
    } catch (error) {
      console.error('Error retrieving memory context:', error);
      return null;
    }
  }
  
  /**
   * Make a decision about how to respond using memory context
   */
  private async makeDecisionWithMemory(message: any, memoryContext: MemoryContext | null) {
    // Extract memories or use empty array if no context
    const memories = memoryContext?.memories || [];
    
    // This would use the decision-making framework with memory context
    // For now, we'll return a mock implementation
    return {
      approach: 'personalized_response',
      confidence: 0.9,
      alternatives: [
        { approach: 'ask_clarifying_question', confidence: 0.6 },
        { approach: 'suggest_product', confidence: 0.7 }
      ]
    };
  }
  
  /**
   * Create memories from the interaction
   */
  private async createMemoriesFromInteraction(
    message: any,
    response: any,
    memoryContext: MemoryContext | null
  ) {
    try {
      // Create interaction memory
      await this.memoryService.createMemory({
        organization_id: this.organizationId,
        user_id: message.user_id,
        content: `Customer said: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`,
        memory_type: AIMemoryType.INTERACTION,
        importance_score: 0.6,
        metadata: {
          contact_id: message.contact_id,
          conversation_id: message.conversation_id,
          message_id: message.id,
          timestamp: new Date().toISOString()
        }
      });
      
      // Create response memory
      await this.memoryService.createMemory({
        organization_id: this.organizationId,
        user_id: message.user_id,
        content: `Agent responded: "${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}"`,
        memory_type: AIMemoryType.INTERACTION,
        importance_score: 0.6,
        metadata: {
          contact_id: message.contact_id,
          conversation_id: message.conversation_id,
          message_id: response.id,
          timestamp: new Date().toISOString()
        }
      });
      
      // Extract potential preferences or insights
      await this.extractInsightsFromMessage(message);
      
    } catch (error) {
      console.error('Error creating memories from interaction:', error);
    }
  }
  
  /**
   * Extract insights from customer message
   */
  private async extractInsightsFromMessage(message: any) {
    // This would use NLP to extract preferences, objections, etc.
    // For now, we'll implement a simple version
    
    const content = message.content.toLowerCase();
    
    // Check for preference indicators
    if (content.includes('prefer') || content.includes('like') || content.includes('want')) {
      await this.memoryService.createMemory({
        organization_id: this.organizationId,
        user_id: message.user_id,
        content: `Customer expressed preference: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`,
        memory_type: AIMemoryType.PREFERENCE,
        importance_score: 0.8,
        metadata: {
          contact_id: message.contact_id,
          conversation_id: message.conversation_id,
          message_id: message.id,
          timestamp: new Date().toISOString(),
          extracted: true
        }
      });
    }
    
    // Check for objection indicators
    if (content.includes('concern') || content.includes('worry') || content.includes('issue') || 
        content.includes('problem') || content.includes('expensive')) {
      await this.memoryService.createMemory({
        organization_id: this.organizationId,
        user_id: message.user_id,
        content: `Customer raised objection: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`,
        memory_type: AIMemoryType.FEEDBACK,
        importance_score: 0.9,
        metadata: {
          contact_id: message.contact_id,
          conversation_id: message.conversation_id,
          message_id: message.id,
          timestamp: new Date().toISOString(),
          extracted: true,
          objection: true
        }
      });
    }
  }
  
  /**
   * Update memory configuration
   */
  async updateMemoryConfig(config: Partial<MemoryEnhancedConfig>) {
    try {
      // Update local config
      this.memoryConfig = {
        ...this.memoryConfig,
        ...config
      };
      
      // Update in database
      await this.supabase
        .from('agent_memory_config')
        .upsert({
          agent_id: this.agentId,
          organization_id: this.organizationId,
          enable_memory_creation: this.memoryConfig.enableMemoryCreation,
          enable_memory_retrieval: this.memoryConfig.enableMemoryRetrieval,
          max_memories_to_retrieve: this.memoryConfig.maxMemoriesToRetrieve,
          min_relevance_score: this.memoryConfig.minRelevanceScore,
          memory_types: this.memoryConfig.memoryTypes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'agent_id,organization_id'
        });
      
    } catch (error) {
      console.error('Error updating memory configuration:', error);
      throw error;
    }
  }
}
