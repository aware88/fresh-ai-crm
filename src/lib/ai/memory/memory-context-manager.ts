/**
 * Memory Context Manager
 * 
 * This service manages the AI's memory context, providing optimized context
 * retrieval, prioritization, and compression for AI interactions.
 * It works with the existing MemoryService to provide enhanced memory capabilities.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { MemoryService } from './memory-service';
import { OpenAIEmbeddings } from '../embeddings/openai-embeddings';
import { AIMemory, AIMemoryType } from './ai-memory-service';

// Types for Memory Context Management
export interface MemoryContextConfig {
  maxContextSize: number;
  relevanceThreshold: number;
  recencyWeight: number;
  importanceWeight: number;
  subscriptionTier: string;
  featureFlags: {
    enableLongTermMemory: boolean;
    enableMemoryCompression: boolean;
    enableContextPrioritization: boolean;
  };
}

export interface MemoryContextResult {
  memories: AIMemory[];
  totalTokens: number;
  truncated: boolean;
  prioritizationStrategy: string;
  metadata: {
    retrievalTime: number;
    memoryCount: {
      retrieved: number;
      selected: number;
      compressed: number;
    };
    contextUtilization: number; // percentage of context used
  };
}

export interface MemoryCompressionResult {
  originalMemories: AIMemory[];
  compressedMemories: AIMemory[];
  compressionRatio: number;
  tokenSavings: number;
}

/**
 * Memory Context Manager class for optimizing AI context windows
 */
export class MemoryContextManager {
  private supabase: SupabaseClient;
  private memoryService: MemoryService;
  private embeddings: OpenAIEmbeddings;
  private defaultConfig: MemoryContextConfig;

  constructor(
    supabase: SupabaseClient, 
    memoryService: MemoryService,
    embeddings: OpenAIEmbeddings,
    config?: Partial<MemoryContextConfig>
  ) {
    this.supabase = supabase;
    this.memoryService = memoryService;
    this.embeddings = embeddings;
    
    // Default configuration
    this.defaultConfig = {
      maxContextSize: 4000, // tokens
      relevanceThreshold: 0.7,
      recencyWeight: 0.3,
      importanceWeight: 0.5,
      subscriptionTier: 'free',
      featureFlags: {
        enableLongTermMemory: true,
        enableMemoryCompression: true,
        enableContextPrioritization: true
      },
      ...config
    };
  }

  /**
   * Get configuration based on subscription tier
   * 
   * @param organizationId - Organization ID for subscription lookup
   * @param userId - Optional user ID for user-specific settings
   * @returns Configuration for memory context
   */
  async getConfigForOrganization(
    organizationId: string,
    userId?: string
  ): Promise<MemoryContextConfig> {
    try {
      // Get organization subscription tier
      const { data: subscription, error: subError } = await this.supabase
        .from('organization_subscriptions')
        .select('subscription_plan_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();
      
      if (subError) {
        console.warn('Error getting subscription, using default config:', subError);
        return this.defaultConfig;
      }
      
      // Get subscription plan features
      const { data: plan, error: planError } = await this.supabase
        .from('subscription_plans')
        .select('name, features')
        .eq('id', subscription.subscription_plan_id)
        .single();
      
      if (planError) {
        console.warn('Error getting subscription plan, using default config:', planError);
        return this.defaultConfig;
      }
      
      // Get user-specific settings if userId provided
      let userSettings = {};
      if (userId) {
        const { data: settings, error: settingsError } = await this.supabase
          .from('ai_agent_settings')
          .select('setting_key, setting_value')
          .eq('organization_id', organizationId)
          .eq('user_id', userId);
        
        if (!settingsError && settings) {
          userSettings = settings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {});
        }
      }
      
      // Build config based on subscription tier and user settings
      const features = plan.features || {};
      const config: MemoryContextConfig = {
        maxContextSize: features.maxContextSize || this.defaultConfig.maxContextSize,
        relevanceThreshold: features.relevanceThreshold || this.defaultConfig.relevanceThreshold,
        recencyWeight: features.recencyWeight || this.defaultConfig.recencyWeight,
        importanceWeight: features.importanceWeight || this.defaultConfig.importanceWeight,
        subscriptionTier: plan.name || 'free',
        featureFlags: {
          enableLongTermMemory: features.enableLongTermMemory !== undefined 
            ? features.enableLongTermMemory 
            : this.defaultConfig.featureFlags.enableLongTermMemory,
          enableMemoryCompression: features.enableMemoryCompression !== undefined 
            ? features.enableMemoryCompression 
            : this.defaultConfig.featureFlags.enableMemoryCompression,
          enableContextPrioritization: features.enableContextPrioritization !== undefined 
            ? features.enableContextPrioritization 
            : this.defaultConfig.featureFlags.enableContextPrioritization
        }
      };
      
      // Apply user-specific overrides if they exist
      if (userSettings['memory_context_size']) {
        config.maxContextSize = parseInt(userSettings['memory_context_size']);
      }
      
      return config;
    } catch (error) {
      console.error('Error in getConfigForOrganization:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Build optimized context for AI interactions
   * 
   * @param query - The current query or context
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalized context
   * @param config - Optional configuration overrides
   * @returns Optimized memory context
   */
  async buildOptimizedContext(
    query: string,
    organizationId: string,
    userId?: string,
    config?: Partial<MemoryContextConfig>
  ): Promise<MemoryContextResult> {
    const startTime = Date.now();
    
    try {
      // Get configuration for this organization
      const orgConfig = await this.getConfigForOrganization(organizationId, userId);
      const finalConfig: MemoryContextConfig = { ...orgConfig, ...config };
      
      // Search for relevant memories
      const relevantMemories = await this.searchRelevantMemories(
        query, 
        organizationId, 
        userId, 
        finalConfig
      );
      
      // Prioritize memories based on relevance, recency, and importance
      const prioritizedMemories = this.prioritizeMemories(
        relevantMemories, 
        finalConfig
      );
      
      // Compress memories if enabled and needed
      let processedMemories = prioritizedMemories;
      let compressedCount = 0;
      
      if (finalConfig.featureFlags.enableMemoryCompression) {
        const compressionResult = await this.compressMemoriesIfNeeded(
          prioritizedMemories, 
          finalConfig.maxContextSize
        );
        
        processedMemories = compressionResult.compressedMemories;
        compressedCount = compressionResult.compressedMemories.length;
      }
      
      // Fit to context window
      const { memories, totalTokens, truncated } = this.fitToContextWindow(
        processedMemories, 
        finalConfig.maxContextSize
      );
      
      // Record memory access for analytics
      this.recordMemoryAccess(memories, organizationId, userId, query);
      
      return {
        memories,
        totalTokens,
        truncated,
        prioritizationStrategy: this.getPrioritizationStrategy(finalConfig),
        metadata: {
          retrievalTime: Date.now() - startTime,
          memoryCount: {
            retrieved: relevantMemories.length,
            selected: memories.length,
            compressed: compressedCount
          },
          contextUtilization: totalTokens / finalConfig.maxContextSize
        }
      };
    } catch (error) {
      console.error('Error building optimized context:', error);
      return {
        memories: [],
        totalTokens: 0,
        truncated: false,
        prioritizationStrategy: 'error',
        metadata: {
          retrievalTime: Date.now() - startTime,
          memoryCount: {
            retrieved: 0,
            selected: 0,
            compressed: 0
          },
          contextUtilization: 0
        }
      };
    }
  }

  /**
   * Search for memories relevant to the current query
   * 
   * @param query - The current query or context
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalized context
   * @param config - Configuration for search
   * @returns Array of relevant memories
   */
  private async searchRelevantMemories(
    query: string,
    organizationId: string,
    userId?: string,
    config?: MemoryContextConfig
  ): Promise<AIMemory[]> {
    try {
      // Search parameters
      const searchParams = {
        organization_id: organizationId,
        query,
        min_importance: 0.3,
        similarity_threshold: config?.relevanceThreshold || 0.7,
        limit: 50 // Get more than needed for prioritization
      };
      
      // Search for memories
      const memories = await this.memoryService.searchMemories(searchParams);
      
      // Filter by user if provided
      const filteredMemories = userId 
        ? memories.filter(memory => !memory.user_id || memory.user_id === userId)
        : memories;
      
      return filteredMemories;
    } catch (error) {
      console.error('Error searching relevant memories:', error);
      return [];
    }
  }

  /**
   * Prioritize memories based on relevance, recency, and importance
   * 
   * @param memories - Array of memories to prioritize
   * @param config - Configuration for prioritization
   * @returns Prioritized array of memories
   */
  private prioritizeMemories(
    memories: AIMemory[],
    config: MemoryContextConfig
  ): AIMemory[] {
    if (!memories.length) return [];
    
    // Calculate scores for each memory
    const scoredMemories = memories.map(memory => {
      // Base score is the importance score
      let score = memory.importance_score;
      
      // Add recency factor (newer memories get higher scores)
      if (memory.created_at) {
        const ageInDays = (Date.now() - new Date(memory.created_at).getTime()) / (1000 * 3600 * 24);
        const recencyScore = Math.max(0, 1 - (ageInDays / 30)); // 0 if older than 30 days
        score += recencyScore * config.recencyWeight;
      }
      
      // Add importance weight
      score *= (1 + config.importanceWeight);
      
      return { memory, score };
    });
    
    // Sort by score (descending)
    scoredMemories.sort((a, b) => b.score - a.score);
    
    // Return prioritized memories
    return scoredMemories.map(item => item.memory);
  }

  /**
   * Compress memories if needed to fit context window
   * 
   * @param memories - Array of memories to compress
   * @param maxTokens - Maximum tokens allowed
   * @returns Compression result with original and compressed memories
   */
  private async compressMemoriesIfNeeded(
    memories: AIMemory[],
    maxTokens: number
  ): Promise<MemoryCompressionResult> {
    // Estimate current token count
    const estimatedTokens = this.estimateTokenCount(memories);
    
    // If we're already under the limit, no compression needed
    if (estimatedTokens <= maxTokens) {
      return {
        originalMemories: memories,
        compressedMemories: memories,
        compressionRatio: 1,
        tokenSavings: 0
      };
    }
    
    // Group similar memories for compression
    const groupedMemories = this.groupSimilarMemories(memories);
    
    // Compress each group
    const compressedMemories: AIMemory[] = [];
    
    for (const group of groupedMemories) {
      if (group.length === 1) {
        // Single memory, no compression needed
        compressedMemories.push(group[0]);
      } else {
        // Multiple similar memories, compress them
        const compressedMemory = await this.compressMemoryGroup(group);
        compressedMemories.push(compressedMemory);
      }
    }
    
    // Calculate compression metrics
    const newTokenCount = this.estimateTokenCount(compressedMemories);
    const compressionRatio = newTokenCount / estimatedTokens;
    const tokenSavings = estimatedTokens - newTokenCount;
    
    return {
      originalMemories: memories,
      compressedMemories,
      compressionRatio,
      tokenSavings
    };
  }

  /**
   * Group similar memories for compression
   * 
   * @param memories - Array of memories to group
   * @returns Array of memory groups
   */
  private groupSimilarMemories(memories: AIMemory[]): AIMemory[][] {
    const groups: AIMemory[][] = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < memories.length; i++) {
      if (processed.has(memories[i].id!)) continue;
      
      const group = [memories[i]];
      processed.add(memories[i].id!);
      
      // Find similar memories
      for (let j = i + 1; j < memories.length; j++) {
        if (processed.has(memories[j].id!)) continue;
        
        // Check if memories are similar (same type and related content)
        if (
          memories[i].memory_type === memories[j].memory_type &&
          this.areMemoriesRelated(memories[i], memories[j])
        ) {
          group.push(memories[j]);
          processed.add(memories[j].id!);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  /**
   * Check if two memories are related
   * 
   * @param memory1 - First memory
   * @param memory2 - Second memory
   * @returns True if memories are related
   */
  private areMemoriesRelated(memory1: AIMemory, memory2: AIMemory): boolean {
    // Simple heuristic: check if they share metadata keys
    const metadata1 = memory1.metadata || {};
    const metadata2 = memory2.metadata || {};
    
    // Check for common entity references
    for (const key of ['entityId', 'entityType', 'contextId']) {
      if (metadata1[key] && metadata2[key] && metadata1[key] === metadata2[key]) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Compress a group of similar memories into a single memory
   * 
   * @param memories - Group of similar memories to compress
   * @returns Compressed memory
   */
  private async compressMemoryGroup(memories: AIMemory[]): Promise<AIMemory> {
    if (memories.length === 0) {
      throw new Error('Cannot compress empty memory group');
    }
    
    if (memories.length === 1) {
      return memories[0];
    }
    
    // Sort by importance (descending)
    memories.sort((a, b) => b.importance_score - a.importance_score);
    
    // Use the most important memory as the base
    const baseMemory = memories[0];
    
    // Combine content from all memories
    const combinedContent = `${baseMemory.content}\n\nAdditional context:\n${
      memories.slice(1).map(m => `- ${m.content}`).join('\n')
    }`;
    
    // Create compressed memory
    const compressedMemory: AIMemory = {
      ...baseMemory,
      content: combinedContent,
      metadata: {
        ...baseMemory.metadata,
        compressed: true,
        original_memory_ids: memories.map(m => m.id).filter(Boolean),
        compression_date: new Date().toISOString()
      }
    };
    
    return compressedMemory;
  }

  /**
   * Fit memories to context window
   * 
   * @param memories - Array of memories to fit
   * @param maxTokens - Maximum tokens allowed
   * @returns Fitted memories, token count, and truncation flag
   */
  private fitToContextWindow(
    memories: AIMemory[],
    maxTokens: number
  ): { memories: AIMemory[], totalTokens: number, truncated: boolean } {
    let totalTokens = 0;
    let fittedMemories: AIMemory[] = [];
    let truncated = false;
    
    for (const memory of memories) {
      const memoryTokens = this.estimateTokenCount([memory]);
      
      if (totalTokens + memoryTokens <= maxTokens) {
        fittedMemories.push(memory);
        totalTokens += memoryTokens;
      } else {
        truncated = true;
        break;
      }
    }
    
    return { memories: fittedMemories, totalTokens, truncated };
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
   * Get prioritization strategy description
   * 
   * @param config - Configuration for prioritization
   * @returns Description of prioritization strategy
   */
  private getPrioritizationStrategy(config: MemoryContextConfig): string {
    const strategies = [];
    
    if (config.recencyWeight > 0) strategies.push('recency');
    if (config.importanceWeight > 0) strategies.push('importance');
    if (config.featureFlags.enableMemoryCompression) strategies.push('compression');
    
    return strategies.join('-');
  }

  /**
   * Record memory access for analytics
   * 
   * @param memories - Array of accessed memories
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalized context
   * @param context - Context of memory access
   */
  private async recordMemoryAccess(
    memories: AIMemory[],
    organizationId: string,
    userId?: string,
    context?: string
  ): Promise<void> {
    try {
      // Record access for each memory
      for (const memory of memories) {
        if (!memory.id) continue;
        
        await this.memoryService.recordAccess(
          memory.id,
          organizationId,
          'retrieve',
          userId,
          context
        );
      }
    } catch (error) {
      console.error('Error recording memory access:', error);
    }
  }
}
