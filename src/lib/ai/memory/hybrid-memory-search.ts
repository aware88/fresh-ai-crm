import { SupabaseClient } from '@supabase/supabase-js';
import { AIMemory } from './ai-memory-service';
import { MemoryService } from './memory-service';
import { OpenAIEmbeddings } from './embeddings/openai-embeddings';

/**
 * Configuration for hybrid memory search
 */
export interface HybridSearchConfig {
  /**
   * Weight for vector search results (0-1)
   */
  vectorWeight: number;
  
  /**
   * Weight for keyword search results (0-1)
   */
  keywordWeight: number;
  
  /**
   * Maximum number of results to return
   */
  maxResults: number;
  
  /**
   * Minimum similarity threshold for vector search (0-1)
   */
  minVectorSimilarity: number;
  
  /**
   * Whether to apply temporal weighting to boost recent memories
   */
  useTemporalWeighting: boolean;
  
  /**
   * Temporal decay factor (higher = faster decay of old memories)
   */
  temporalDecayFactor: number;
}

/**
 * Default configuration for hybrid search
 */
const DEFAULT_HYBRID_SEARCH_CONFIG: HybridSearchConfig = {
  vectorWeight: 0.7,
  keywordWeight: 0.3,
  maxResults: 50,
  minVectorSimilarity: 0.6,
  useTemporalWeighting: true,
  temporalDecayFactor: 0.01 // Gentle decay
};

/**
 * Memory with search relevance score
 */
export interface RankedMemory extends AIMemory {
  /**
   * Combined relevance score (0-1)
   */
  relevanceScore: number;
  
  /**
   * Vector similarity score (0-1)
   */
  vectorScore: number;
  
  /**
   * Keyword match score (0-1)
   */
  keywordScore: number;
  
  /**
   * Temporal recency score (0-1)
   */
  temporalScore: number;
}

/**
 * Service for hybrid memory search combining vector and keyword search
 */
export class HybridMemorySearch {
  /**
   * Constructor for HybridMemorySearch
   * 
   * @param supabase - Supabase client for database operations
   * @param memoryService - Memory service for memory operations
   * @param embeddings - OpenAI embeddings service
   */
  constructor(
    private supabase: SupabaseClient,
    private memoryService: MemoryService,
    private embeddings: OpenAIEmbeddings
  ) {}
  
  /**
   * Get configuration for hybrid search based on organization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Hybrid search configuration
   */
  async getConfigForOrganization(organizationId: string): Promise<HybridSearchConfig> {
    // In the future, this could fetch organization-specific configurations
    // For now, return the default configuration
    return DEFAULT_HYBRID_SEARCH_CONFIG;
  }
  
  /**
   * Perform hybrid search combining vector similarity and keyword matching
   * 
   * @param query - Search query
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalization
   * @returns Array of memories ranked by relevance
   */
  async search(
    query: string,
    organizationId: string,
    userId?: string
  ): Promise<RankedMemory[]> {
    const config = await this.getConfigForOrganization(organizationId);
    
    // Perform vector search
    const vectorResults = await this.performVectorSearch(query, organizationId, userId, config);
    
    // Perform keyword search
    const keywordResults = await this.performKeywordSearch(query, organizationId, userId, config);
    
    // Combine and rank results
    const combinedResults = await this.combineSearchResults(
      vectorResults,
      keywordResults,
      config,
      organizationId
    );
    
    return combinedResults;
  }
  
  /**
   * Perform vector similarity search
   * 
   * @param query - Search query
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalization
   * @param config - Search configuration
   * @returns Array of memories with vector similarity scores
   */
  private async performVectorSearch(
    query: string,
    organizationId: string,
    userId?: string,
    config?: HybridSearchConfig
  ): Promise<RankedMemory[]> {
    // Use the existing memory service to perform vector search
    const vectorResults = await this.memoryService.searchMemories(
      query,
      organizationId,
      userId
    );
    
    // Convert to RankedMemory format with vector scores
    return vectorResults.map(memory => {
      // Extract similarity score from metadata if available
      const vectorScore = memory.metadata?.similarity !== undefined
        ? memory.metadata.similarity
        : 0.5; // Default if not available
      
      return {
        ...memory,
        vectorScore,
        keywordScore: 0, // Will be populated later
        temporalScore: 0, // Will be populated later
        relevanceScore: 0 // Will be calculated after combining
      };
    });
  }
  
  /**
   * Perform keyword-based search
   * 
   * @param query - Search query
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalization
   * @param config - Search configuration
   * @returns Array of memories with keyword match scores
   */
  private async performKeywordSearch(
    query: string,
    organizationId: string,
    userId?: string,
    config?: HybridSearchConfig
  ): Promise<RankedMemory[]> {
    // Prepare search query
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    if (searchTerms.length === 0) {
      return [];
    }
    
    // Build SQL query with text search
    // This is a simplified version - in production, use proper full-text search
    let sqlQuery = this.supabase
      .from('memories')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Add user filter if provided
    if (userId) {
      sqlQuery = sqlQuery.eq('user_id', userId);
    }
    
    // Add text search conditions
    // Note: This is a simple implementation - in production, use proper full-text search
    const searchConditions = searchTerms.map(term => `content.ilike.%${term}%`);
    sqlQuery = sqlQuery.or(searchConditions.join(','));
    
    // Execute query
    const { data: memories, error } = await sqlQuery;
    
    if (error || !memories) {
      console.error('Error in keyword search:', error);
      return [];
    }
    
    // Calculate keyword match scores
    return memories.map(memory => {
      const content = memory.content.toLowerCase();
      
      // Calculate how many search terms match
      const matchingTerms = searchTerms.filter(term => content.includes(term));
      const keywordScore = matchingTerms.length / searchTerms.length;
      
      return {
        ...memory,
        vectorScore: 0, // Will be populated when combining results
        keywordScore,
        temporalScore: 0, // Will be populated later
        relevanceScore: 0 // Will be calculated after combining
      };
    });
  }
  
  /**
   * Calculate temporal recency score
   * 
   * @param memory - Memory to score
   * @param decayFactor - Temporal decay factor
   * @returns Temporal score between 0-1
   */
  private calculateTemporalScore(memory: AIMemory, decayFactor: number): number {
    const createdAt = new Date(memory.created_at);
    const now = new Date();
    const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Apply exponential decay based on age
    return Math.exp(-decayFactor * ageInDays);
  }
  
  /**
   * Combine vector and keyword search results
   * 
   * @param vectorResults - Results from vector search
   * @param keywordResults - Results from keyword search
   * @param config - Search configuration
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Combined and ranked search results
   */
  private async combineSearchResults(
    vectorResults: RankedMemory[],
    keywordResults: RankedMemory[],
    config: HybridSearchConfig,
    organizationId: string
  ): Promise<RankedMemory[]> {
    // Create a map to merge results by memory ID
    const resultMap = new Map<string, RankedMemory>();
    
    // Process vector results
    vectorResults.forEach(memory => {
      resultMap.set(memory.id, {
        ...memory,
        keywordScore: 0 // Default if not found in keyword results
      });
    });
    
    // Process keyword results
    keywordResults.forEach(memory => {
      if (resultMap.has(memory.id)) {
        // Memory exists in vector results, update keyword score
        const existingMemory = resultMap.get(memory.id)!;
        resultMap.set(memory.id, {
          ...existingMemory,
          keywordScore: memory.keywordScore
        });
      } else {
        // New memory from keyword search
        resultMap.set(memory.id, {
          ...memory,
          vectorScore: 0 // Default if not found in vector results
        });
      }
    });
    
    // Calculate temporal scores if enabled
    if (config.useTemporalWeighting) {
      for (const [id, memory] of resultMap.entries()) {
        const temporalScore = this.calculateTemporalScore(memory, config.temporalDecayFactor);
        resultMap.set(id, {
          ...memory,
          temporalScore
        });
      }
    }
    
    // Calculate combined relevance scores
    const combinedResults: RankedMemory[] = [];
    for (const memory of resultMap.values()) {
      // Ensure all scores are defined
      const vectorScore = memory.vectorScore || 0;
      const keywordScore = memory.keywordScore || 0;
      const temporalScore = config.useTemporalWeighting ? (memory.temporalScore || 0) : 1;
      
      // Calculate weighted relevance score
      const weightedScore = 
        (vectorScore * config.vectorWeight) + 
        (keywordScore * config.keywordWeight);
      
      // Apply temporal weighting
      const relevanceScore = weightedScore * temporalScore;
      
      combinedResults.push({
        ...memory,
        vectorScore,
        keywordScore,
        temporalScore,
        relevanceScore
      });
    }
    
    // Sort by relevance score (descending)
    combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Apply minimum similarity threshold and limit results
    return combinedResults
      .filter(memory => memory.relevanceScore >= config.minVectorSimilarity)
      .slice(0, config.maxResults);
  }
  
  /**
   * Search for memories related to a specific memory
   * 
   * @param memoryId - ID of the memory to find related memories for
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalization
   * @returns Array of related memories ranked by relevance
   */
  async findRelatedMemories(
    memoryId: string,
    organizationId: string,
    userId?: string
  ): Promise<RankedMemory[]> {
    // First get the source memory
    const { data: sourceMemory, error } = await this.supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .eq('organization_id', organizationId)
      .single();
    
    if (error || !sourceMemory) {
      console.error('Error fetching source memory:', error);
      return [];
    }
    
    // Get explicitly related memories from relationships table
    const explicitlyRelated = await this.getExplicitlyRelatedMemories(
      memoryId,
      organizationId
    );
    
    // Use the memory content as a query to find semantically similar memories
    const semanticallyRelated = await this.search(
      sourceMemory.content,
      organizationId,
      userId
    );
    
    // Combine and deduplicate
    const combinedResults = [...explicitlyRelated];
    
    // Add semantically related memories that aren't already included
    for (const memory of semanticallyRelated) {
      if (!combinedResults.some(m => m.id === memory.id) && memory.id !== memoryId) {
        combinedResults.push(memory);
      }
    }
    
    // Sort by relevance score
    return combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Get memories explicitly related to a memory via the relationships table
   * 
   * @param memoryId - ID of the memory to find related memories for
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of explicitly related memories
   */
  private async getExplicitlyRelatedMemories(
    memoryId: string,
    organizationId: string
  ): Promise<RankedMemory[]> {
    // Query relationships where the memory is either source or target
    const { data: relationships, error } = await this.supabase
      .from('memory_relationships')
      .select('*, source_memory:source_memory_id(*), target_memory:target_memory_id(*)')
      .or(`source_memory_id.eq.${memoryId},target_memory_id.eq.${memoryId}`)
      .eq('organization_id', organizationId);
    
    if (error || !relationships) {
      console.error('Error fetching memory relationships:', error);
      return [];
    }
    
    // Extract related memories and assign high relevance scores
    const relatedMemories: RankedMemory[] = [];
    
    relationships.forEach(rel => {
      // Get the memory that isn't the source memory
      const relatedMemory = rel.source_memory_id === memoryId
        ? rel.target_memory
        : rel.source_memory;
      
      if (relatedMemory) {
        // Assign high scores to explicitly related memories
        relatedMemories.push({
          ...relatedMemory,
          vectorScore: 0.9, // High score for explicit relationships
          keywordScore: 0.9,
          temporalScore: 1.0,
          relevanceScore: 0.9
        });
      }
    });
    
    return relatedMemories;
  }
}
