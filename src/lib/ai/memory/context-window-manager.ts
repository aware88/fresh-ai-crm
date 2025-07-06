import { SupabaseClient } from '@supabase/supabase-js';
import { AIMemory } from './ai-memory-service';
import { MemoryService } from './memory-service';
import { MemoryImportanceService, ScoredMemory } from './memory-importance-service';
import { OpenAIEmbeddings } from './embeddings/openai-embeddings';

/**
 * Configuration for context window management
 */
export interface ContextWindowConfig {
  /**
   * Maximum number of tokens in the context window
   */
  maxTokens: number;
  
  /**
   * Minimum importance score for memories to include (0-1)
   */
  minImportanceThreshold: number;
  
  /**
   * Maximum number of memories to include
   */
  maxMemories: number;
  
  /**
   * Whether to use memory compression
   */
  useCompression: boolean;
  
  /**
   * Target compression ratio (e.g., 0.7 means compress to 70% of original size)
   */
  compressionRatio: number;
  
  /**
   * Whether to include memory relationships
   */
  includeRelationships: boolean;
  
  /**
   * Whether to prioritize recent memories
   */
  prioritizeRecent: boolean;
}

/**
 * Default configuration for context window management
 */
const DEFAULT_CONTEXT_CONFIG: ContextWindowConfig = {
  maxTokens: 4000,
  minImportanceThreshold: 0.3,
  maxMemories: 50,
  useCompression: true,
  compressionRatio: 0.7,
  includeRelationships: true,
  prioritizeRecent: true
};

/**
 * Memory with token count
 */
export interface TokenizedMemory extends ScoredMemory {
  tokenCount: number;
  compressedContent?: string;
}

/**
 * Context window containing selected memories
 */
export interface ContextWindow {
  memories: TokenizedMemory[];
  totalTokens: number;
  memoryCount: number;
  averageImportance: number;
}

/**
 * Service for managing the context window for AI interactions
 */
export class ContextWindowManager {
  /**
   * Constructor for ContextWindowManager
   * 
   * @param supabase - Supabase client for database operations
   * @param memoryService - Memory service for memory operations
   * @param importanceService - Memory importance service
   * @param embeddings - OpenAI embeddings service
   */
  constructor(
    private supabase: SupabaseClient,
    private memoryService: MemoryService,
    private importanceService: MemoryImportanceService,
    private embeddings: OpenAIEmbeddings
  ) {}
  
  /**
   * Get configuration for context window management based on organization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Context window configuration
   */
  async getConfigForOrganization(organizationId: string): Promise<ContextWindowConfig> {
    // In the future, this could fetch organization-specific configurations
    // For now, return the default configuration
    return DEFAULT_CONTEXT_CONFIG;
  }
  
  /**
   * Estimate the number of tokens in a text string
   * This is a simple approximation - in production, use a proper tokenizer
   * 
   * @param text - Text to estimate tokens for
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Compress memory content to reduce token usage
   * 
   * @param memory - Memory to compress
   * @param targetRatio - Target compression ratio (e.g., 0.7 = compress to 70% of original)
   * @returns Compressed memory content
   */
  async compressMemoryContent(memory: AIMemory, targetRatio: number): Promise<string> {
    // For now, use a simple approach: keep first part and summarize the rest
    const content = memory.content;
    const tokenCount = this.estimateTokenCount(content);
    const targetTokens = Math.floor(tokenCount * targetRatio);
    
    // If content is already small, no need to compress
    if (tokenCount <= targetTokens) {
      return content;
    }
    
    // Simple compression: keep first part and add "..."
    // In a real implementation, use AI to create a proper summary
    const approxCharsToKeep = targetTokens * 4;
    return content.substring(0, approxCharsToKeep) + "...";
    
    // TODO: Implement AI-based compression using OpenAI
    // This would create a more intelligent summary while preserving key information
  }
  
  /**
   * Calculate token count for a memory
   * 
   * @param memory - Memory to tokenize
   * @param useCompression - Whether to compress the memory content
   * @param compressionRatio - Target compression ratio
   * @returns Memory with token count and optionally compressed content
   */
  async tokenizeMemory(
    memory: ScoredMemory,
    useCompression: boolean,
    compressionRatio: number
  ): Promise<TokenizedMemory> {
    let content = memory.content;
    let tokenCount = this.estimateTokenCount(content);
    
    // Apply compression if enabled and needed
    if (useCompression) {
      const compressedContent = await this.compressMemoryContent(memory, compressionRatio);
      const compressedTokenCount = this.estimateTokenCount(compressedContent);
      
      // Only use compression if it actually reduces tokens
      if (compressedTokenCount < tokenCount) {
        content = compressedContent;
        tokenCount = compressedTokenCount;
        
        return {
          ...memory,
          tokenCount,
          compressedContent
        };
      }
    }
    
    return {
      ...memory,
      tokenCount
    };
  }
  
  /**
   * Build an optimal context window from available memories
   * 
   * @param query - Query or conversation context to build context for
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalization
   * @returns Context window with selected memories
   */
  async buildContextWindow(
    query: string,
    organizationId: string,
    userId?: string
  ): Promise<ContextWindow> {
    // Get configuration
    const config = await this.getConfigForOrganization(organizationId);
    
    // Get relevant memories using the memory service
    const relevantMemories = await this.memoryService.searchMemories(
      query,
      organizationId,
      userId
    );
    
    // Score memories by importance
    const scoredMemories = await this.importanceService.scoreAndSortMemories(
      relevantMemories,
      organizationId
    );
    
    // Filter by minimum importance threshold
    const importantMemories = scoredMemories.filter(
      memory => memory.importanceScore >= config.minImportanceThreshold
    );
    
    // Tokenize memories and apply compression if needed
    const tokenizationPromises = importantMemories.map(memory => 
      this.tokenizeMemory(memory, config.useCompression, config.compressionRatio)
    );
    const tokenizedMemories = await Promise.all(tokenizationPromises);
    
    // Select memories for context window (knapsack problem)
    const selectedMemories = this.selectMemoriesForContext(
      tokenizedMemories,
      config.maxTokens,
      config.maxMemories
    );
    
    // Calculate statistics
    const totalTokens = selectedMemories.reduce((sum, memory) => sum + memory.tokenCount, 0);
    const averageImportance = selectedMemories.length > 0
      ? selectedMemories.reduce((sum, memory) => sum + memory.importanceScore, 0) / selectedMemories.length
      : 0;
    
    // Return context window
    return {
      memories: selectedMemories,
      totalTokens,
      memoryCount: selectedMemories.length,
      averageImportance
    };
  }
  
  /**
   * Select the optimal set of memories for the context window
   * Uses a greedy algorithm to maximize importance while staying within token limits
   * 
   * @param memories - Array of tokenized memories
   * @param maxTokens - Maximum tokens allowed in context
   * @param maxMemories - Maximum number of memories to include
   * @returns Selected memories for context window
   */
  private selectMemoriesForContext(
    memories: TokenizedMemory[],
    maxTokens: number,
    maxMemories: number
  ): TokenizedMemory[] {
    // Sort memories by importance score (descending)
    const sortedMemories = [...memories].sort((a, b) => 
      b.importanceScore - a.importanceScore
    );
    
    const selectedMemories: TokenizedMemory[] = [];
    let totalTokens = 0;
    
    // Add memories until we hit token or memory limit
    for (const memory of sortedMemories) {
      if (selectedMemories.length >= maxMemories) {
        break;
      }
      
      if (totalTokens + memory.tokenCount <= maxTokens) {
        selectedMemories.push(memory);
        totalTokens += memory.tokenCount;
      }
    }
    
    return selectedMemories;
  }
  
  /**
   * Format context window for inclusion in AI prompt
   * 
   * @param contextWindow - Context window to format
   * @returns Formatted context string
   */
  formatContextForPrompt(contextWindow: ContextWindow): string {
    if (contextWindow.memories.length === 0) {
      return "No relevant memories available.";
    }
    
    let formattedContext = `RELEVANT MEMORIES (${contextWindow.memoryCount} items):\n\n`;
    
    contextWindow.memories.forEach((memory, index) => {
      const content = memory.compressedContent || memory.content;
      formattedContext += `[Memory ${index + 1}] Type: ${memory.type}, Importance: ${memory.importanceScore.toFixed(2)}\n`;
      formattedContext += `${content}\n\n`;
    });
    
    return formattedContext;
  }
  
  /**
   * Record memory access for importance tracking
   * 
   * @param memoryIds - Array of memory IDs that were accessed
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID
   * @param context - Context of the access (e.g., "conversation", "search")
   * @returns Number of access records created
   */
  async recordMemoryAccess(
    memoryIds: string[],
    organizationId: string,
    userId?: string,
    context?: string
  ): Promise<number> {
    if (memoryIds.length === 0) {
      return 0;
    }
    
    const timestamp = new Date().toISOString();
    const accessRecords = memoryIds.map(memoryId => ({
      memory_id: memoryId,
      organization_id: organizationId,
      user_id: userId || null,
      access_time: timestamp,
      access_context: context || 'context_window',
      metadata: {}
    }));
    
    // Insert access records in batches
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < accessRecords.length; i += batchSize) {
      const batch = accessRecords.slice(i, i + batchSize);
      
      const { data, error } = await this.supabase
        .from('memory_access')
        .insert(batch)
        .select('id');
      
      if (!error && data) {
        insertedCount += data.length;
      }
    }
    
    return insertedCount;
  }
}
