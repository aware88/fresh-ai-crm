import { SupabaseClient } from '@supabase/supabase-js';
import { AIMemory, AIMemoryType } from './ai-memory-service';
import { MemoryService } from './memory-service';
import { OpenAIEmbeddings } from './embeddings/openai-embeddings';

/**
 * Configuration for memory importance scoring
 */
export interface ImportanceScoringConfig {
  /**
   * Weight for recency factor (0-1)
   */
  recencyWeight: number;
  
  /**
   * Weight for usage frequency factor (0-1)
   */
  usageFrequencyWeight: number;
  
  /**
   * Weight for feedback factor (0-1)
   */
  feedbackWeight: number;
  
  /**
   * Weight for relationship density factor (0-1)
   */
  relationshipDensityWeight: number;
  
  /**
   * Weight for explicit importance factor (0-1)
   */
  explicitImportanceWeight: number;
  
  /**
   * Decay factor for recency scoring (higher = faster decay)
   */
  recencyDecayFactor: number;
  
  /**
   * Maximum age in days to consider for full recency score
   */
  maxRecencyAgeDays: number;
}

/**
 * Default configuration for memory importance scoring
 */
const DEFAULT_IMPORTANCE_CONFIG: ImportanceScoringConfig = {
  recencyWeight: 0.3,
  usageFrequencyWeight: 0.2,
  feedbackWeight: 0.2,
  relationshipDensityWeight: 0.15,
  explicitImportanceWeight: 0.15,
  recencyDecayFactor: 0.1,
  maxRecencyAgeDays: 30
};

/**
 * Memory with importance score
 */
export interface ScoredMemory extends AIMemory {
  importanceScore: number;
}

/**
 * Service for calculating and managing memory importance
 */
export class MemoryImportanceService {
  /**
   * Constructor for MemoryImportanceService
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
   * Get configuration for importance scoring based on organization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Importance scoring configuration
   */
  async getConfigForOrganization(organizationId: string): Promise<ImportanceScoringConfig> {
    // In the future, this could fetch organization-specific configurations
    // For now, return the default configuration
    return DEFAULT_IMPORTANCE_CONFIG;
  }
  
  /**
   * Calculate importance score for a single memory
   * 
   * @param memory - Memory to score
   * @param config - Scoring configuration
   * @returns Importance score between 0-1
   */
  async calculateMemoryImportance(
    memory: AIMemory,
    config: ImportanceScoringConfig
  ): Promise<number> {
    // Calculate individual factors
    const recencyScore = this.calculateRecencyScore(memory, config);
    const usageScore = await this.calculateUsageScore(memory);
    const feedbackScore = await this.calculateFeedbackScore(memory);
    const relationshipScore = await this.calculateRelationshipScore(memory);
    const explicitScore = this.calculateExplicitImportance(memory);
    
    // Combine factors using weighted average
    const importanceScore = 
      (recencyScore * config.recencyWeight) +
      (usageScore * config.usageFrequencyWeight) +
      (feedbackScore * config.feedbackWeight) +
      (relationshipScore * config.relationshipDensityWeight) +
      (explicitScore * config.explicitImportanceWeight);
    
    // Ensure score is between 0-1
    return Math.max(0, Math.min(1, importanceScore));
  }
  
  /**
   * Calculate recency score based on memory creation date
   * 
   * @param memory - Memory to score
   * @param config - Scoring configuration
   * @returns Recency score between 0-1
   */
  private calculateRecencyScore(
    memory: AIMemory,
    config: ImportanceScoringConfig
  ): number {
    const createdAt = new Date(memory.created_at);
    const now = new Date();
    const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Apply exponential decay based on age
    const recencyScore = Math.exp(-config.recencyDecayFactor * ageInDays);
    
    // If memory is newer than maxRecencyAgeDays, give it full score
    if (ageInDays <= config.maxRecencyAgeDays) {
      return 1.0;
    }
    
    return recencyScore;
  }
  
  /**
   * Calculate usage score based on how often the memory has been accessed
   * 
   * @param memory - Memory to score
   * @returns Usage score between 0-1
   */
  private async calculateUsageScore(memory: AIMemory): Promise<number> {
    // Query memory_access table to get usage count
    const { data, error } = await this.supabase
      .from('memory_access')
      .select('count(*)')
      .eq('memory_id', memory.id);
    
    if (error || !data || data.length === 0) {
      return 0;
    }
    
    // Normalize usage count (assuming max reasonable usage is 100)
    const usageCount = data[0].count;
    return Math.min(usageCount / 100, 1);
  }
  
  /**
   * Calculate feedback score based on user feedback
   * 
   * @param memory - Memory to score
   * @returns Feedback score between 0-1
   */
  private async calculateFeedbackScore(memory: AIMemory): Promise<number> {
    // Query memory_feedback table if it exists
    // For now, use metadata.feedback_score if available
    if (memory.metadata && typeof memory.metadata.feedback_score === 'number') {
      // Normalize to 0-1 (assuming feedback_score is 1-5)
      return (memory.metadata.feedback_score - 1) / 4;
    }
    
    return 0.5; // Neutral score if no feedback
  }
  
  /**
   * Calculate relationship score based on number of connections
   * 
   * @param memory - Memory to score
   * @returns Relationship score between 0-1
   */
  private async calculateRelationshipScore(memory: AIMemory): Promise<number> {
    // Count relationships where this memory is either source or target
    const { data, error } = await this.supabase
      .from('memory_relationships')
      .select('count(*)')
      .or(`source_memory_id.eq.${memory.id},target_memory_id.eq.${memory.id}`);
    
    if (error || !data || data.length === 0) {
      return 0;
    }
    
    // Normalize relationship count (assuming max reasonable connections is 20)
    const relationshipCount = data[0].count;
    return Math.min(relationshipCount / 20, 1);
  }
  
  /**
   * Calculate explicit importance based on metadata
   * 
   * @param memory - Memory to score
   * @returns Explicit importance score between 0-1
   */
  private calculateExplicitImportance(memory: AIMemory): number {
    // Check if memory has explicit importance in metadata
    if (memory.metadata && typeof memory.metadata.importance === 'number') {
      // Ensure it's between 0-1
      return Math.max(0, Math.min(1, memory.metadata.importance));
    }
    
    // Default importance based on memory type
    switch (memory.type) {
      case AIMemoryType.INSIGHT:
        return 0.9; // Insights are highly important
      case AIMemoryType.DECISION:
        return 0.8; // Decisions are important
      case AIMemoryType.FEEDBACK:
        return 0.7; // User feedback is important
      case AIMemoryType.PREFERENCE:
        return 0.7; // User preferences are important
      case AIMemoryType.OBSERVATION:
        return 0.5; // Observations are moderately important
      case AIMemoryType.INTERACTION:
        return 0.4; // Interactions are moderately important
      default:
        return 0.5; // Default moderate importance
    }
  }
  
  /**
   * Score a batch of memories and return them sorted by importance
   * 
   * @param memories - Array of memories to score
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of memories with importance scores, sorted by importance
   */
  async scoreAndSortMemories(
    memories: AIMemory[],
    organizationId: string
  ): Promise<ScoredMemory[]> {
    const config = await this.getConfigForOrganization(organizationId);
    
    // Calculate importance for each memory
    const scoringPromises = memories.map(async (memory) => {
      const importanceScore = await this.calculateMemoryImportance(memory, config);
      return {
        ...memory,
        importanceScore
      };
    });
    
    // Wait for all scoring to complete
    const scoredMemories = await Promise.all(scoringPromises);
    
    // Sort by importance score (descending)
    return scoredMemories.sort((a, b) => b.importanceScore - a.importanceScore);
  }
  
  /**
   * Update importance metadata for memories in the database
   * 
   * @param scoredMemories - Array of memories with importance scores
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Number of memories updated
   */
  async persistImportanceScores(
    scoredMemories: ScoredMemory[],
    organizationId: string
  ): Promise<number> {
    let updatedCount = 0;
    
    // Update memories in batches to avoid overloading the database
    const batchSize = 50;
    for (let i = 0; i < scoredMemories.length; i += batchSize) {
      const batch = scoredMemories.slice(i, i + batchSize);
      
      // Update each memory in the batch
      const updatePromises = batch.map(async (memory) => {
        // Ensure metadata exists
        const metadata = memory.metadata || {};
        
        // Add importance score to metadata
        metadata.importance = memory.importanceScore;
        metadata.last_importance_update = new Date().toISOString();
        
        // Update memory in database
        const { error } = await this.supabase
          .from('memories')
          .update({ metadata })
          .eq('id', memory.id)
          .eq('organization_id', organizationId);
        
        return error ? 0 : 1;
      });
      
      // Wait for batch to complete and count successes
      const results = await Promise.all(updatePromises);
      updatedCount += results.reduce((sum, result) => sum + result, 0);
    }
    
    return updatedCount;
  }
}
