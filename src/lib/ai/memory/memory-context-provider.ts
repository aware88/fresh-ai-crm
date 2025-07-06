/**
 * Memory Context Provider
 * 
 * This service integrates with AI agents to provide optimized memory context
 * for AI interactions. It handles context window management, memory retrieval,
 * and context optimization based on subscription tier and user preferences.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryContextManager, MemoryContextConfig, MemoryContextResult } from './memory-context-manager';
import { MemoryService } from './memory-service';
import { OpenAIEmbeddings } from '../embeddings/openai-embeddings';
import { AIMemory } from './ai-memory-service';

// Types for Memory Context Provider
export interface ContextProviderConfig extends MemoryContextConfig {
  enableContextPersistence: boolean;
  enableContextSharing: boolean;
  enableCrossUserMemories: boolean;
  contextRetentionDays: number;
}

export interface MemoryContext {
  memories: AIMemory[];
  contextId: string;
  metadata: {
    tokenCount: number;
    memoryCount: number;
    retrievalTime: number;
    contextUtilization: number;
    truncated: boolean;
  };
}

export interface ContextRequest {
  query: string;
  organizationId: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
  contextId?: string; // For continuing from previous context
  maxTokens?: number;
  includeTypes?: string[];
  excludeTypes?: string[];
  metadataFilters?: Record<string, any>;
}

/**
 * Memory Context Provider class for integrating with AI agents
 */
export class MemoryContextProvider {
  private supabase: SupabaseClient;
  private memoryService: MemoryService;
  private contextManager: MemoryContextManager;
  private embeddings: OpenAIEmbeddings;
  private defaultConfig: ContextProviderConfig;

  constructor(
    supabase: SupabaseClient,
    memoryService: MemoryService,
    config?: Partial<ContextProviderConfig>
  ) {
    this.supabase = supabase;
    this.memoryService = memoryService;
    this.embeddings = new OpenAIEmbeddings();
    
    // Default configuration
    this.defaultConfig = {
      maxContextSize: 4000,
      relevanceThreshold: 0.7,
      recencyWeight: 0.3,
      importanceWeight: 0.5,
      subscriptionTier: 'free',
      enableContextPersistence: true,
      enableContextSharing: false,
      enableCrossUserMemories: false,
      contextRetentionDays: 30,
      featureFlags: {
        enableLongTermMemory: true,
        enableMemoryCompression: true,
        enableContextPrioritization: true
      },
      ...config
    };
    
    // Initialize context manager
    this.contextManager = new MemoryContextManager(
      supabase,
      memoryService,
      this.embeddings,
      this.defaultConfig
    );
  }

  /**
   * Get memory context for an AI interaction
   * 
   * @param request - Context request parameters
   * @returns Memory context for AI
   */
  async getContext(request: ContextRequest): Promise<MemoryContext> {
    const startTime = Date.now();
    
    try {
      // Get configuration for this organization
      const config = await this.getConfigForRequest(request);
      
      // Apply request-specific overrides
      if (request.maxTokens) {
        config.maxContextSize = request.maxTokens;
      }
      
      // Check for existing context if contextId provided
      if (request.contextId && config.enableContextPersistence) {
        const existingContext = await this.getExistingContext(request.contextId);
        if (existingContext) {
          return existingContext;
        }
      }
      
      // Build optimized context
      const contextResult = await this.contextManager.buildOptimizedContext(
        request.query,
        request.organizationId,
        request.userId,
        config
      );
      
      // Filter memories by type if requested
      let filteredMemories = contextResult.memories;
      
      if (request.includeTypes && request.includeTypes.length > 0) {
        filteredMemories = filteredMemories.filter(
          memory => request.includeTypes!.includes(memory.memory_type)
        );
      }
      
      if (request.excludeTypes && request.excludeTypes.length > 0) {
        filteredMemories = filteredMemories.filter(
          memory => !request.excludeTypes!.includes(memory.memory_type)
        );
      }
      
      // Apply metadata filters if provided
      if (request.metadataFilters) {
        filteredMemories = this.filterByMetadata(
          filteredMemories,
          request.metadataFilters
        );
      }
      
      // Create context object
      const contextId = await this.persistContext(
        filteredMemories,
        request,
        config
      );
      
      const context: MemoryContext = {
        memories: filteredMemories,
        contextId,
        metadata: {
          tokenCount: contextResult.totalTokens,
          memoryCount: filteredMemories.length,
          retrievalTime: Date.now() - startTime,
          contextUtilization: contextResult.totalTokens / config.maxContextSize,
          truncated: contextResult.truncated
        }
      };
      
      return context;
    } catch (error) {
      console.error('Error getting memory context:', error);
      
      // Return empty context on error
      return {
        memories: [],
        contextId: '',
        metadata: {
          tokenCount: 0,
          memoryCount: 0,
          retrievalTime: Date.now() - startTime,
          contextUtilization: 0,
          truncated: false
        }
      };
    }
  }

  /**
   * Get configuration for a context request
   * 
   * @param request - Context request parameters
   * @returns Configuration for context provider
   */
  private async getConfigForRequest(request: ContextRequest): Promise<ContextProviderConfig> {
    try {
      // Get base configuration from context manager
      const baseConfig = await this.contextManager.getConfigForOrganization(
        request.organizationId,
        request.userId
      );
      
      // Get agent-specific settings if agentId provided
      let agentSettings = {};
      if (request.agentId) {
        const { data: settings, error: settingsError } = await this.supabase
          .from('ai_agent_settings')
          .select('setting_key, setting_value')
          .eq('organization_id', request.organizationId)
          .eq('agent_id', request.agentId);
        
        if (!settingsError && settings) {
          agentSettings = settings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {});
        }
      }
      
      // Build config with agent settings
      const config: ContextProviderConfig = {
        ...baseConfig,
        enableContextPersistence: 
          agentSettings['enable_context_persistence'] !== undefined
            ? agentSettings['enable_context_persistence'] === 'true'
            : this.defaultConfig.enableContextPersistence,
        enableContextSharing:
          agentSettings['enable_context_sharing'] !== undefined
            ? agentSettings['enable_context_sharing'] === 'true'
            : this.defaultConfig.enableContextSharing,
        enableCrossUserMemories:
          agentSettings['enable_cross_user_memories'] !== undefined
            ? agentSettings['enable_cross_user_memories'] === 'true'
            : this.defaultConfig.enableCrossUserMemories,
        contextRetentionDays:
          agentSettings['context_retention_days'] !== undefined
            ? parseInt(agentSettings['context_retention_days'])
            : this.defaultConfig.contextRetentionDays
      };
      
      return config;
    } catch (error) {
      console.error('Error getting config for request:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Get existing context by ID
   * 
   * @param contextId - ID of the context to retrieve
   * @returns Memory context if found, null otherwise
   */
  private async getExistingContext(contextId: string): Promise<MemoryContext | null> {
    try {
      // Get context from database
      const { data: contextData, error } = await this.supabase
        .from('ai_memory_contexts')
        .select('*')
        .eq('id', contextId)
        .single();
      
      if (error || !contextData) {
        return null;
      }
      
      // Get memories for this context
      const { data: contextMemories, error: memoryError } = await this.supabase
        .from('ai_memory_context_items')
        .select('memory_id, position')
        .eq('context_id', contextId)
        .order('position', { ascending: true });
      
      if (memoryError || !contextMemories || contextMemories.length === 0) {
        return null;
      }
      
      // Get the actual memories
      const memoryIds = contextMemories.map(item => item.memory_id);
      const memories = await this.memoryService.getMemoriesByIds(memoryIds);
      
      // Sort memories by position
      const sortedMemories = memories.sort((a, b) => {
        const aPos = contextMemories.find(item => item.memory_id === a.id)?.position || 0;
        const bPos = contextMemories.find(item => item.memory_id === b.id)?.position || 0;
        return aPos - bPos;
      });
      
      return {
        memories: sortedMemories,
        contextId,
        metadata: {
          tokenCount: contextData.token_count || 0,
          memoryCount: sortedMemories.length,
          retrievalTime: 0,
          contextUtilization: contextData.context_utilization || 0,
          truncated: contextData.truncated || false
        }
      };
    } catch (error) {
      console.error('Error getting existing context:', error);
      return null;
    }
  }

  /**
   * Persist context to database for future reference
   * 
   * @param memories - Memories in the context
   * @param request - Original context request
   * @param config - Configuration for context provider
   * @returns Context ID
   */
  private async persistContext(
    memories: AIMemory[],
    request: ContextRequest,
    config: ContextProviderConfig
  ): Promise<string> {
    // Skip persistence if disabled
    if (!config.enableContextPersistence) {
      return '';
    }
    
    try {
      const contextId = request.contextId || crypto.randomUUID();
      const tokenCount = this.estimateTokenCount(memories);
      
      // Store context metadata
      await this.supabase
        .from('ai_memory_contexts')
        .upsert({
          id: contextId,
          organization_id: request.organizationId,
          user_id: request.userId,
          agent_id: request.agentId,
          conversation_id: request.conversationId,
          query: request.query,
          token_count: tokenCount,
          memory_count: memories.length,
          context_utilization: tokenCount / config.maxContextSize,
          truncated: tokenCount > config.maxContextSize,
          created_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + config.contextRetentionDays * 24 * 60 * 60 * 1000
          ).toISOString()
        });
      
      // Store context items (memories)
      const contextItems = memories.map((memory, index) => ({
        context_id: contextId,
        memory_id: memory.id,
        position: index,
        organization_id: request.organizationId
      }));
      
      if (contextItems.length > 0) {
        // Delete existing items first if updating
        if (request.contextId) {
          await this.supabase
            .from('ai_memory_context_items')
            .delete()
            .eq('context_id', contextId);
        }
        
        // Insert new items
        await this.supabase
          .from('ai_memory_context_items')
          .insert(contextItems);
      }
      
      return contextId;
    } catch (error) {
      console.error('Error persisting context:', error);
      return '';
    }
  }

  /**
   * Filter memories by metadata
   * 
   * @param memories - Memories to filter
   * @param filters - Metadata filters
   * @returns Filtered memories
   */
  private filterByMetadata(
    memories: AIMemory[],
    filters: Record<string, any>
  ): AIMemory[] {
    return memories.filter(memory => {
      const metadata = memory.metadata || {};
      
      // Check each filter
      for (const [key, value] of Object.entries(filters)) {
        // Skip if metadata doesn't have this key
        if (!(key in metadata)) {
          return false;
        }
        
        // Check if value matches
        if (metadata[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Estimate token count for memories
   * 
   * @param memories - Array of memories to estimate tokens for
   * @returns Estimated token count
   */
  private estimateTokenCount(memories: AIMemory[]): number {
    // Simple estimation: ~4 characters per token
    return memories.reduce((total, memory) => {
      return total + Math.ceil(memory.content.length / 4);
    }, 0);
  }

  /**
   * Update context with feedback
   * 
   * @param contextId - ID of the context to update
   * @param feedback - Feedback about the context quality
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Updated context
   */
  async updateContextWithFeedback(
    contextId: string,
    feedback: {
      relevanceScore?: number;
      usefulnessScore?: number;
      feedback?: string;
    },
    organizationId: string
  ): Promise<void> {
    try {
      // Skip if no contextId
      if (!contextId) return;
      
      // Update context with feedback
      await this.supabase
        .from('ai_memory_contexts')
        .update({
          relevance_score: feedback.relevanceScore,
          usefulness_score: feedback.usefulnessScore,
          feedback: feedback.feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', contextId)
        .eq('organization_id', organizationId);
      
      // If we have scores, update memory importance
      if (feedback.relevanceScore || feedback.usefulnessScore) {
        // Get memories for this context
        const { data: contextMemories } = await this.supabase
          .from('ai_memory_context_items')
          .select('memory_id')
          .eq('context_id', contextId);
        
        if (contextMemories && contextMemories.length > 0) {
          // Update importance for each memory
          for (const item of contextMemories) {
            await this.memoryService.updateMemoryImportance(
              item.memory_id,
              organizationId,
              feedback.usefulnessScore || feedback.relevanceScore || 0.5
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating context with feedback:', error);
    }
  }

  /**
   * Format memories for inclusion in AI prompt
   * 
   * @param context - Memory context
   * @returns Formatted context string
   */
  formatContextForPrompt(context: MemoryContext): string {
    if (!context.memories || context.memories.length === 0) {
      return '';
    }
    
    let formattedContext = '### Relevant Context\n\n';
    
    // Group memories by type
    const groupedMemories: Record<string, AIMemory[]> = {};
    
    for (const memory of context.memories) {
      if (!groupedMemories[memory.memory_type]) {
        groupedMemories[memory.memory_type] = [];
      }
      
      groupedMemories[memory.memory_type].push(memory);
    }
    
    // Format each group
    for (const [type, memories] of Object.entries(groupedMemories)) {
      formattedContext += `## ${this.formatMemoryType(type)}\n\n`;
      
      for (const memory of memories) {
        formattedContext += `- ${memory.content}\n`;
        
        // Add metadata if it's a summary
        if (memory.metadata?.is_summary) {
          formattedContext += `  (Summary of ${memory.metadata.original_memory_count} related items)\n`;
        }
      }
      
      formattedContext += '\n';
    }
    
    return formattedContext;
  }

  /**
   * Format memory type for display
   * 
   * @param type - Memory type
   * @returns Formatted type string
   */
  private formatMemoryType(type: string): string {
    // Convert snake_case or SCREAMING_SNAKE_CASE to Title Case
    return type
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
